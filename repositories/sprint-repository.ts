import "server-only";

import { db } from "@/lib/db";
import type { SprintStatus } from "@/lib/generated/prisma/enums";

const sprintSelect = {
  id: true,
  projectId: true,
  number: true,
  name: true,
  goal: true,
  status: true,
  startDate: true,
  endDate: true,
  _count: { select: { tasks: true } },
} as const;

export function findSprints(projectId: string) {
  return db.sprint.findMany({
    where: { projectId },
    select: sprintSelect,
    orderBy: [{ startDate: "desc" }],
  });
}

export function findSprintById(sprintId: string) {
  return db.sprint.findUnique({
    where: { id: sprintId },
    select: sprintSelect,
  });
}

export function findActiveSprint(projectId: string) {
  return db.sprint.findFirst({
    where: { projectId, status: "ACTIVE" },
    select: sprintSelect,
  });
}

export function createSprint(input: {
  projectId: string;
  name: string;
  goal: string | null;
  startDate: Date;
  endDate: Date;
}) {
  return db.$transaction(async (tx) => {
    const highest = await tx.sprint.findFirst({
      where: { projectId: input.projectId },
      select: { number: true },
      orderBy: { number: "desc" },
    });

    return tx.sprint.create({
      data: { ...input, number: (highest?.number ?? 0) + 1 },
      select: sprintSelect,
    });
  });
}

export function findSprintByNumber(projectId: string, sprintNumber: number) {
  return db.sprint.findUnique({
    where: { projectId_number: { projectId, number: sprintNumber } },
    select: sprintSelect,
  });
}

export function updateSprint(
  sprintId: string,
  data: { name: string; goal: string | null; startDate: Date; endDate: Date }
) {
  return db.sprint.update({
    where: { id: sprintId },
    data,
    select: sprintSelect,
  });
}

export function setSprintStatus(sprintId: string, status: SprintStatus) {
  return db.sprint.update({
    where: { id: sprintId },
    data: { status },
    select: sprintSelect,
  });
}

export function deleteSprint(sprintId: string) {
  return db.sprint.delete({ where: { id: sprintId } });
}

export function assignTaskToSprint(
  taskId: string,
  sprintId: string | null,
  columnId?: string
) {
  return db.task.update({
    where: { id: taskId },
    data: columnId ? { sprintId, columnId } : { sprintId },
    select: { id: true, sprintId: true, columnId: true },
  });
}

export function countIncompleteTasks(sprintId: string) {
  return db.task.count({
    where: { sprintId, column: { isDone: false } },
  });
}

export function moveIncompleteTasksToBacklog(sprintId: string) {
  return db.task.updateMany({
    where: { sprintId, column: { isDone: false } },
    data: { sprintId: null },
  });
}

export function findSprintTaskStats(sprintId: string) {
  return db.task.findMany({
    where: { sprintId },
    select: { id: true, column: { select: { isDone: true } } },
  });
}
