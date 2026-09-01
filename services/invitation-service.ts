import "server-only";

import { randomBytes } from "node:crypto";

import { requireWorkspacePermission } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  ActivityType,
  NotificationType,
  WorkspaceRole,
} from "@/lib/generated/prisma/enums";
import { invitationUrl, sendInvitationEmail } from "@/lib/email/invitation-email";
import * as activityRepo from "@/repositories/activity-repository";
import * as repo from "@/repositories/invitation-repository";
import * as userRepo from "@/repositories/user-repository";
import * as workspaceRepo from "@/repositories/workspace-repository";
import * as notificationService from "@/services/notification-service";
import type {
  InviteMemberInput,
  RevokeInvitationInput,
} from "@/schemas/workspace";
import type { InvitationDTO, InviteMemberResultDTO } from "@/types/dto";

const EXPIRY_DAYS = 7;

type InvitationRecord = NonNullable<
  Awaited<ReturnType<typeof repo.findInvitationById>>
>;

function toInvitationDTO(invitation: InvitationRecord): InvitationDTO {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    invitedBy: invitation.invitedBy,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}

export async function listInvitations(
  workspaceId: string
): Promise<readonly InvitationDTO[]> {
  await requireWorkspacePermission(workspaceId, PERMISSIONS.MEMBER_INVITE);

  return (await repo.findPendingInvitations(workspaceId)).map(toInvitationDTO);
}

export async function inviteMember(
  input: InviteMemberInput
): Promise<InviteMemberResultDTO> {
  const context = await requireWorkspacePermission(
    input.workspaceId,
    PERMISSIONS.MEMBER_INVITE
  );

  const existingUser = await repo.findUserByEmail(input.email);

  if (existingUser) {
    const membership = await workspaceRepo.findMembership(
      input.workspaceId,
      existingUser.id
    );
    if (membership) {
      throw new ConflictError("That person is already in this workspace.");
    }
  }

  const pending = await repo.findPendingInvitation(
    input.workspaceId,
    input.email
  );

  if (pending) {
    throw new ConflictError("This user already has a pending invitation.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

  const invitation = await repo.upsertInvitation({
    workspaceId: input.workspaceId,
    email: input.email,
    role: input.role,
    token: randomBytes(32).toString("base64url"),
    invitedById: context.user.id,
    expiresAt,
  });

  const delivery = await sendInvitationEmail({
    email: invitation.email,
    token: invitation.token,
    workspaceName: invitation.workspace.name,
    inviterName: context.user.name,
  });

  await activityRepo.recordActivity({
    workspaceId: input.workspaceId,
    actorId: context.user.id,
    type: ActivityType.MEMBER_ADDED,
    metadata: { memberName: invitation.email, invited: true },
  });

  if (existingUser) {
    await notificationService.notify(
      [
        {
          recipientId: existingUser.id,
          actorId: context.user.id,
          type: NotificationType.WORKSPACE_INVITATION,
          title: `${context.user.name} invited you to ${invitation.workspace.name}`,
          workspaceId: input.workspaceId,
        },
      ],
      context.user.id
    );
  }

  return {
    invitation: toInvitationDTO(invitation),
    emailSent: delivery.sent,
    invitationUrl: invitationUrl(invitation.token),
  };
}

export async function revokeInvitation(
  input: RevokeInvitationInput
): Promise<void> {
  const invitation = await repo.findInvitationById(input.invitationId);
  if (!invitation) throw new NotFoundError("Invitation not found.");

  await requireWorkspacePermission(
    invitation.workspaceId,
    PERMISSIONS.MEMBER_INVITE
  );

  await repo.revokeInvitation(input.invitationId);
}

export interface AcceptedInvitation {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly workspaceName: string;
}

export async function acceptInvitation(
  token: string
): Promise<AcceptedInvitation> {
  const user = await requireUser();

  const invitation = await repo.findInvitationByToken(token);
  if (!invitation) throw new NotFoundError("That invitation is not valid.");

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new ForbiddenError(
      "That invitation was sent to a different email address."
    );
  }

  if (invitation.status !== "PENDING") {
    const member = await workspaceRepo.findMembership(
      invitation.workspaceId,
      user.id
    );

    if (!member) {
      throw new ConflictError("That invitation has already been used.");
    }

    await userRepo.markOnboarded(user.id);

    return {
      workspaceId: invitation.workspaceId,
      workspaceSlug: invitation.workspace.slug,
      workspaceName: invitation.workspace.name,
    };
  }

  if (invitation.expiresAt < new Date()) {
    throw new ConflictError("That invitation has expired.");
  }

  await repo.acceptInvitation({
    invitationId: invitation.id,
    workspaceId: invitation.workspaceId,
    userId: user.id,
    role: invitation.role as WorkspaceRole,
  });

  await userRepo.markOnboarded(user.id);

  await activityRepo.recordActivity({
    workspaceId: invitation.workspaceId,
    actorId: user.id,
    type: ActivityType.MEMBER_ADDED,
    metadata: { memberName: user.name },
  });

  return {
    workspaceId: invitation.workspaceId,
    workspaceSlug: invitation.workspace.slug,
    workspaceName: invitation.workspace.name,
  };
}

export type InvitationLanding =
  | { readonly state: "invalid"; readonly reason: string }
  | {
      readonly state: "ready";
      readonly email: string;
      readonly workspaceName: string;
      readonly hasAccount: boolean;
    };

export async function getInvitationLanding(
  token: string
): Promise<InvitationLanding> {
  const invitation = await repo.findInvitationByToken(token);

  if (!invitation) {
    return { state: "invalid", reason: "That invitation is not valid." };
  }

  if (invitation.status !== "PENDING") {
    return {
      state: "invalid",
      reason: "That invitation has already been used.",
    };
  }

  if (invitation.expiresAt < new Date()) {
    return { state: "invalid", reason: "That invitation has expired." };
  }

  const email = invitation.email.toLowerCase();
  const account = await userRepo.findUserByEmail(email);

  return {
    state: "ready",
    email,
    workspaceName: invitation.workspace.name,
    hasAccount: account !== null,
  };
}
