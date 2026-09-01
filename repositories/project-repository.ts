import "server-only";

import { db } from "@/lib/db";
import { DEFAULT_BOARD_COLUMNS, POSITION_STEP } from "@/lib/constants";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ProjectStatus } from "@/lib/generated/prisma/enums";
import { userSelect } from "@/repositories/workspace-repository";

const projectSelect = {
  id: true,
  workspaceId: true,
  workspace: { select: { slug: true } },
  name: true,
  slug: true,
  key: true,
  description: true,
  color: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: userSelect },
  _count: { select: { members: true, tasks: true } },
} as const;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  select: typeof projectSelect;
}>;

export function findProjectsForWorkspace(filters: {
  workspaceId: string;
  status?: ProjectStatus;
  search?: string;
}) {
  return db.project.findMany({
    where: {
      workspaceId: filters.workspaceId,
      status: filters.status,
      name: filters.search
        ? { contains: filters.search, mode: "insensitive" }
        : undefined,
    },
    select: projectSelect,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

export function findFirstProject(workspaceId: string) {
  return db.project.findFirst({
    where: { workspaceId, status: { not: "ARCHIVED" } },
    select: { id: true, name: true, key: true, slug: true },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

export function findProjectInWorkspace(projectId: string, workspaceId: string) {
  return db.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true, name: true, key: true, slug: true },
  });
}

export function findProjectById(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    select: projectSelect,
  });
}

export async function nextProjectKey(
  workspaceId: string,
  name: string
): Promise<string> {
  const base =
    name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "PRJ";

  const taken = new Set(
    (
      await db.project.findMany({
        where: { workspaceId, key: { startsWith: base } },
        select: { key: true },
      })
    ).map((p) => p.key)
  );

  if (!taken.has(base)) return base;

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${base}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }

  return `${base}${Date.now().toString().slice(-4)}`;
}

export function createProjectWithBoard(input: {
  workspaceId: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  createdById: string;
  memberIds: readonly string[];
}) {
  return db.project.create({
    data: {
      workspaceId: input.workspaceId,
      key: input.key,
      slug: input.slug,
      name: input.name,
      description: input.description,
      color: input.color,
      status: input.status,
      createdById: input.createdById,
      members: {
        create: input.memberIds.map((userId) => ({ userId })),
      },
      columns: {
        create: DEFAULT_BOARD_COLUMNS.map((column, index) => ({
          name: column.name,
          isDone: column.isDone,
          position: (index + 1) * POSITION_STEP,
        })),
      },
    },
    select: projectSelect,
  });
}

export function updateProject(
  projectId: string,
  data: {
    name: string;
    description: string | null;
    color: string;
    status: ProjectStatus;
  }
) {
  return db.project.update({
    where: { id: projectId },
    data,
    select: projectSelect,
  });
}

export function deleteProject(projectId: string) {
  return db.project.delete({ where: { id: projectId } });
}

export function countProjectsByStatus(workspaceId: string) {
  return db.project.groupBy({
    by: ["status"],
    where: { workspaceId },
    _count: { _all: true },
  });
}

export function findProjectByName(workspaceId: string, name: string) {
  return db.project.findFirst({
    where: { workspaceId, name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
}

export function findProjectBySlug(workspaceId: string, slug: string) {
  return db.project.findFirst({
    where: { workspaceId, slug },
    select: { id: true, name: true, key: true, slug: true },
  });
}

export function findTakenSlugs(workspaceId: string, prefix: string) {
  return db.project.findMany({
    where: { workspaceId, slug: { startsWith: prefix } },
    select: { slug: true },
  });
}
