import "server-only";

import { db } from "@/lib/db";
import type { WorkspaceRole } from "@/lib/generated/prisma/enums";
import { userSelect } from "@/repositories/workspace-repository";

const invitationSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  token: true,
  expiresAt: true,
  createdAt: true,
  workspaceId: true,
  workspace: { select: { id: true, name: true, slug: true } },
  invitedBy: { select: userSelect },
} as const;

export function findPendingInvitations(workspaceId: string) {
  return db.workspaceInvitation.findMany({
    where: { workspaceId, status: "PENDING" },
    select: invitationSelect,
    orderBy: { createdAt: "desc" },
  });
}

export function findInvitationByToken(token: string) {
  return db.workspaceInvitation.findUnique({
    where: { token },
    select: invitationSelect,
  });
}

export function findInvitationById(invitationId: string) {
  return db.workspaceInvitation.findUnique({
    where: { id: invitationId },
    select: invitationSelect,
  });
}

export async function upsertInvitation(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invitedById: string;
  expiresAt: Date;
}) {
 
  const pending = await db.workspaceInvitation.findFirst({
    where: {
      workspaceId: input.workspaceId,
      email: input.email,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (pending) {
    return db.workspaceInvitation.update({
      where: { id: pending.id },
      data: {
        role: input.role,
        token: input.token,
        invitedById: input.invitedById,
        expiresAt: input.expiresAt,
      },
      select: invitationSelect,
    });
  }

  return db.workspaceInvitation.create({
    data: { ...input, status: "PENDING" },
    select: invitationSelect,
  });
}

export function revokeInvitation(invitationId: string) {
  return db.workspaceInvitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
    select: { id: true },
  });
}

export function acceptInvitation(input: {
  invitationId: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}) {
  return db.$transaction([
    db.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: input.userId,
        },
      },
      update: {},
      create: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.role,
      },
      select: { id: true },
    }),
    db.workspaceInvitation.update({
      where: { id: input.invitationId },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
      select: { id: true },
    }),
  ]);
}

export function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export function findPendingTokensForEmail(email: string) {
  return db.workspaceInvitation.findMany({
    where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
    select: { workspaceId: true, token: true },
  });
}
