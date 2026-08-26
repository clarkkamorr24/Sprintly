import "server-only";

import { db } from "@/lib/db";
import { DEFAULT_BOARD_COLUMNS, POSITION_STEP } from "@/lib/constants";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ProjectStatus } from "@/lib/generated/prisma/enums";
import { userSelect } from "@/repositories/workspace-repository";

const projectSelect = {
  id: true,
  workspaceId: true,
  name: true,
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

export function findProjectById(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    select: projectSelect,
  });
}

/**
 * Creates the project, its member list, and the default board columns in one
 * transaction so a project can never exist without a usable board.
 */
export function createProjectWithBoard(input: {
  workspaceId: string;
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
