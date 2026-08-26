import "server-only";

import { db } from "@/lib/db";
import type { WorkspaceRole } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

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

/** Creates the workspace and its owner membership atomically. */
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
