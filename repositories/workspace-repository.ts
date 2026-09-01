import "server-only";

import { db } from "@/lib/db";
import type { WorkspaceRole } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@prisma/client";

export const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

const workspaceListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  _count: { select: { members: true, projects: true } },
} as const;

export type WorkspaceRecord = Prisma.WorkspaceGetPayload<{
  select: typeof workspaceListSelect;
}>;

export function findWorkspacesForUser(userId: string) {
  return db.workspaceMember.findMany({
    where: { userId, workspace: { archivedAt: null } },
    select: { role: true, workspace: { select: workspaceListSelect } },
    orderBy: { workspace: { createdAt: "asc" } },
  });
}

export function findWorkspaceById(workspaceId: string) {
  return db.workspace.findUnique({
    where: { id: workspaceId },
    select: workspaceListSelect,
  });
}

export function findWorkspaceBySlug(slug: string) {
  return db.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });
}

export function findWorkspaceMembers(workspaceId: string) {
  return db.workspaceMember.findMany({
    where: { workspaceId },
    select: { role: true, joinedAt: true, user: { select: userSelect } },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });
}

export function findMembership(workspaceId: string, userId: string) {
  return db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { id: true, role: true },
  });
}

export function countOwners(workspaceId: string) {
  return db.workspaceMember.count({
    where: { workspaceId, role: "OWNER" },
  });
}

export function createWorkspaceWithOwner(input: {
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
}) {
  return db.workspace.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      createdById: input.ownerId,
      members: { create: { userId: input.ownerId, role: "OWNER" } },
    },
    select: workspaceListSelect,
  });
}

export function updateWorkspace(
  workspaceId: string,
  data: { name: string; description: string | null }
) {
  return db.workspace.update({
    where: { id: workspaceId },
    data,
    select: workspaceListSelect,
  });
}

export function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
) {
  return db.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role },
    select: { role: true, joinedAt: true, user: { select: userSelect } },
  });
}

export function removeMember(workspaceId: string, userId: string) {
  return db.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export function deleteWorkspace(workspaceId: string) {
  return db.workspace.delete({ where: { id: workspaceId } });
}

export function transferOwnership(input: {
  workspaceId: string;
  fromUserId: string;
  toUserId: string;
}) {
  return db.$transaction([
    db.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: input.toUserId,
        },
      },
      data: { role: "OWNER" },
      select: { id: true },
    }),
    db.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: input.fromUserId,
        },
      },
      data: { role: "ADMIN" },
      select: { id: true },
    }),
    db.workspace.update({
      where: { id: input.workspaceId },
      data: { createdById: input.toUserId },
      select: { id: true },
    }),
  ]);
}

export function updateWorkspaceIcon(workspaceId: string, iconColor: string) {
  return db.workspace.update({
    where: { id: workspaceId },
    data: { iconColor },
    select: { id: true },
  });
}

export function findWorkspaceSlugs(workspaceIds: readonly string[]) {
  return db.workspace.findMany({
    where: { id: { in: [...workspaceIds] } },
    select: { id: true, slug: true },
  });
}

export function findWorkspaceSlugsByProject(projectIds: readonly string[]) {
  return db.project.findMany({
    where: { id: { in: [...projectIds] } },
    select: { id: true, workspace: { select: { slug: true } } },
  });
}

export async function findWorkspaceMembersByHandle(
  workspaceId: string,
  handles: readonly string[]
) {
  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
    select: { user: { select: { id: true, name: true, email: true } } },
  });

  const wanted = new Set(handles.map((handle) => handle.toLowerCase()));

  return members
    .map((member) => member.user)
    .filter((user) =>
      [
        user.name.replace(/\s+/g, ""),
        user.name.split(/\s+/)[0],
        user.email.split("@")[0],
      ].some((handle) => wanted.has(handle.toLowerCase()))
    )
    .map(({ id, name }) => ({ id, name }));
}
