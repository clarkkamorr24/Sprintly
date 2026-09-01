import "server-only";

import { db } from "@/lib/db";

const workspaceScope = (workspaceId: string) => ({
  project: { workspaceId },
});

export function countCreatedSince(workspaceId: string, since: Date) {
  return db.task.findMany({
    where: { ...workspaceScope(workspaceId), createdAt: { gte: since } },
    select: { createdAt: true },
  });
}

export function countCompletedSince(workspaceId: string, since: Date) {
  return db.task.findMany({
    where: { ...workspaceScope(workspaceId), completedAt: { gte: since } },
    select: { completedAt: true },
  });
}

export function findWorkloadByAssignee(workspaceId: string) {
  return db.taskAssignee.findMany({
    where: {
      task: { ...workspaceScope(workspaceId), completedAt: null },
    },
    select: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      task: { select: { id: true, dueDate: true, priority: true } },
    },
  });
}

export function findUnassignedOpenCount(workspaceId: string) {
  return db.task.count({
    where: {
      ...workspaceScope(workspaceId),
      completedAt: null,
      assignees: { none: {} },
    },
  });
}

export function findSprintOutcomes(workspaceId: string) {
  return db.sprint.findMany({
    where: { project: { workspaceId } },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      project: { select: { key: true } },
      tasks: {
        select: { id: true, completedAt: true, storyPoints: true },
      },
    },
    orderBy: { startDate: "desc" },
    take: 8,
  });
}

export function findProjectProgress(workspaceId: string) {
  return db.project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      key: true,
      color: true,
      tasks: { select: { completedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function countOpenByType(workspaceId: string) {
  return db.task.groupBy({
    by: ["type"],
    where: { ...workspaceScope(workspaceId), completedAt: null },
    _count: { _all: true },
  });
}

export function findAgeingOpenTasks(workspaceId: string, take: number) {
  return db.task.findMany({
    where: { ...workspaceScope(workspaceId), completedAt: null },
    select: {
      id: true,
      title: true,
      number: true,
      priority: true,
      createdAt: true,
      dueDate: true,
      project: { select: { key: true } },
      assignees: { select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take,
  });
}
