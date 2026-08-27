import "server-only";

import { requireUser } from "@/lib/auth/session";
import {
  requireWorkspaceAccess,
  requireWorkspacePermission,
} from "@/lib/auth/guards";
import { hasAtLeastRole, PERMISSIONS } from "@/lib/auth/permissions";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { WorkspaceRole } from "@/lib/generated/prisma/enums";
import * as repo from "@/repositories/workspace-repository";
import type {
  CreateWorkspaceInput,
  DeleteWorkspaceInput,
  TransferOwnershipInput,
  RemoveMemberInput,
  UpdateMemberRoleInput,
  UpdateWorkspaceInput,
} from "@/schemas/workspace";
import type { UserDTO, WorkspaceDTO, WorkspaceMemberDTO } from "@/types/dto";

type WorkspaceRecord = Awaited<ReturnType<typeof repo.findWorkspaceById>>;

function toWorkspaceDTO(
  workspace: NonNullable<WorkspaceRecord>,
  role: WorkspaceRole
): WorkspaceDTO {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    description: workspace.description,
    role,
    memberCount: workspace._count.members,
    projectCount: workspace._count.projects,
    createdAt: workspace.createdAt.toISOString(),
  };
}

function toMemberDTO(member: {
  role: WorkspaceRole;
  joinedAt: Date;
  user: UserDTO;
}): WorkspaceMemberDTO {
  return {
    user: member.user,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "workspace";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate =
      attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 7)}`;

    if (!(await repo.findWorkspaceBySlug(candidate))) return candidate;
  }

  throw new ConflictError("Could not generate a unique workspace URL.");
}

export async function listWorkspaces(): Promise<readonly WorkspaceDTO[]> {
  const user = await requireUser();
  const memberships = await repo.findWorkspacesForUser(user.id);

  return memberships.map((m) => toWorkspaceDTO(m.workspace, m.role));
}

export async function getWorkspace(workspaceId: string): Promise<WorkspaceDTO> {
  const { role } = await requireWorkspaceAccess(workspaceId);
  const workspace = await repo.findWorkspaceById(workspaceId);

  if (!workspace) throw new NotFoundError("Workspace not found.");

  return toWorkspaceDTO(workspace, role);
}

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<WorkspaceDTO> {
  const user = await requireUser();
  const slug = await generateUniqueSlug(input.name);

  const workspace = await repo.createWorkspaceWithOwner({
    name: input.name,
    slug,
    description: input.description?.trim() || null,
    ownerId: user.id,
  });

  return toWorkspaceDTO(workspace, WorkspaceRole.OWNER);
}

export async function updateWorkspace(
  input: UpdateWorkspaceInput
): Promise<WorkspaceDTO> {
  const { role } = await requireWorkspacePermission(
    input.workspaceId,
    PERMISSIONS.WORKSPACE_UPDATE
  );

  const workspace = await repo.updateWorkspace(input.workspaceId, {
    name: input.name,
    description: input.description?.trim() || null,
  });

  return toWorkspaceDTO(workspace, role);
}

export async function listMembers(
  workspaceId: string
): Promise<readonly WorkspaceMemberDTO[]> {
  await requireWorkspaceAccess(workspaceId);
  const members = await repo.findWorkspaceMembers(workspaceId);

  return members.map(toMemberDTO);
}

export async function updateMemberRole(
  input: UpdateMemberRoleInput
): Promise<WorkspaceMemberDTO> {
  const context = await requireWorkspacePermission(
    input.workspaceId,
    PERMISSIONS.MEMBER_ROLE_UPDATE
  );

  const target = await repo.findMembership(input.workspaceId, input.userId);
  if (!target) throw new NotFoundError("That member is not in this workspace.");

  if (target.role === WorkspaceRole.OWNER) {
    throw new ForbiddenError("The workspace owner's role cannot be changed.");
  }

  if (input.userId === context.user.id) {
    throw new ForbiddenError("You cannot change your own role.");
  }

  const member = await repo.updateMemberRole(
    input.workspaceId,
    input.userId,
    input.role
  );

  return toMemberDTO(member);
}

export async function removeMember(input: RemoveMemberInput): Promise<void> {
  const context = await requireWorkspaceAccess(input.workspaceId);

  const isSelf = input.userId === context.user.id;

  if (!isSelf && !hasAtLeastRole(context.role, WorkspaceRole.ADMIN)) {
    throw new ForbiddenError("You do not have permission to remove members.");
  }

  const target = await repo.findMembership(input.workspaceId, input.userId);
  if (!target) throw new NotFoundError("That member is not in this workspace.");

  if (target.role === WorkspaceRole.OWNER) {
    if (!isSelf) {
      throw new ForbiddenError("The workspace owner cannot be removed.");
    }

    if ((await repo.countOwners(input.workspaceId)) <= 1) {
      throw new ConflictError(
        "Transfer ownership before leaving this workspace."
      );
    }
  }

  await repo.removeMember(input.workspaceId, input.userId);
}

export async function deleteWorkspace(
  input: DeleteWorkspaceInput
): Promise<void> {
  const context = await requireWorkspacePermission(
    input.workspaceId,
    PERMISSIONS.WORKSPACE_DELETE
  );

  const workspace = await repo.findWorkspaceById(input.workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found.");

  if (workspace.name !== input.confirmName) {
    throw new ValidationError("The workspace name does not match.", {
      confirmName: ["Type the workspace name exactly to confirm."],
    });
  }

  const owned = await repo.findWorkspacesForUser(context.user.id);
  if (owned.length <= 1) {
    throw new ConflictError(
      "You cannot delete your only workspace. Create another one first."
    );
  }

  await repo.deleteWorkspace(input.workspaceId);
}

export async function transferOwnership(
  input: TransferOwnershipInput
): Promise<void> {
  const context = await requireWorkspaceAccess(input.workspaceId);

  if (context.role !== WorkspaceRole.OWNER) {
    throw new ForbiddenError("Only the workspace owner can transfer ownership.");
  }

  if (input.toUserId === context.user.id) {
    throw new ConflictError("You already own this workspace.");
  }

  const target = await repo.findMembership(input.workspaceId, input.toUserId);
  if (!target) throw new NotFoundError("That member is not in this workspace.");

  await repo.transferOwnership({
    workspaceId: input.workspaceId,
    fromUserId: context.user.id,
    toUserId: input.toUserId,
  });
}
