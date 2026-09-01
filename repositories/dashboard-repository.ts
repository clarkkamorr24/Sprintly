import "server-only";

import { db } from "@/lib/db";
import { userSelect } from "@/repositories/workspace-repository";

export function countProjectsByStatus(workspaceId: string) {
  return db.project.groupBy({
    by: ["status"],
    where: { workspaceId },
    _count: { _all: true },
  });
}

export function countTasks(projectIds: readonly string[]) {
  if (projectIds.length === 0) return Promise.resolve(0);
  return db.task.count({ where: { projectId: { in: [...projectIds] } } });
}

export function countCompletedTasks(projectIds: readonly string[]) {
  if (projectIds.length === 0) return Promise.resolve(0);
  return db.task.count({
    where: { projectId: { in: [...projectIds] }, column: { isDone: true } },
  });
}

export function countOverdueTasks(projectIds: readonly string[], now: Date) {
  if (projectIds.length === 0) return Promise.resolve(0);
  return db.task.count({
    where: {
      projectId: { in: [...projectIds] },
      dueDate: { lt: now },
      column: { isDone: false },
    },
  });
}

export function countTasksByPriority(projectIds: readonly string[]) {
  if (projectIds.length === 0) return Promise.resolve([]);
  return db.task.groupBy({
    by: ["priority"],
    where: { projectId: { in: [...projectIds] }, column: { isDone: false } },
    _count: { _all: true },
  });
}

export function findMyOpenTasks(input: {
  projectIds: readonly string[];
  userId: string;
  take: number;
}) {
  if (input.projectIds.length === 0) return Promise.resolve([]);

  return db.task.findMany({
    where: {
      projectId: { in: [...input.projectIds] },
      assignees: { some: { userId: input.userId } },
      column: { isDone: false },
    },
    select: {
      id: true,
      title: true,
      priority: true,
      dueDate: true,
      project: { select: { id: true, name: true, color: true, slug: true } },
      column: { select: { name: true } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
    take: input.take,
  });
}

export function countMyOpenTasks(
  projectIds: readonly string[],
  userId: string
) {
  if (projectIds.length === 0) return Promise.resolve(0);
  return db.task.count({
    where: {
      projectId: { in: [...projectIds] },
      assignees: { some: { userId } },
      column: { isDone: false },
    },
  });
}

export function findRecentActivity(workspaceId: string, take: number) {
  return db.activityLog.findMany({
    where: { workspaceId },
    select: {
      id: true,
      type: true,
      metadata: true,
      createdAt: true,
      actor: { select: userSelect },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function findAccessibleProjectIds(workspaceId: string) {
  return db.project.findMany({
    where: { workspaceId },
    select: { id: true },
  });
}
