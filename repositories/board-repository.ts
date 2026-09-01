import "server-only";

import { POSITION_STEP } from "@/lib/constants";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { userSelect } from "@/repositories/workspace-repository";

const taskCardSelect = {
  id: true,
  columnId: true,
  number: true,
  type: true,
  storyPoints: true,
  title: true,
  project: { select: { key: true } },
  priority: true,
  position: true,
  dueDate: true,
  description: true,
  assignees: { select: { user: { select: userSelect } } },
  labels: { select: { label: { select: { id: true, name: true, color: true } } } },
  subtasks: { select: { isCompleted: true } },
  sprintId: true,
  sprint: { select: { name: true } },
  _count: { select: { comments: true } },
} as const;

export type TaskCardRecord = Prisma.TaskGetPayload<{
  select: typeof taskCardSelect;
}>;

export function findBoard(projectId: string, where: Prisma.TaskWhereInput = {}) {
  return db.boardColumn.findMany({
    where: { projectId },
    select: {
      id: true,
      name: true,
      position: true,
      isDone: true,
      tasks: {
        where,
        select: taskCardSelect,
        orderBy: { position: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });
}

export function findColumnById(columnId: string) {
  return db.boardColumn.findUnique({
    where: { id: columnId },
    select: {
      id: true,
      name: true,
      projectId: true,
      position: true,
      isDone: true,
    },
  });
}

export function findColumnIds(projectId: string) {
  return db.boardColumn.findMany({
    where: { projectId },
    select: { id: true },
    orderBy: { position: "asc" },
  });
}

export function countColumns(projectId: string) {
  return db.boardColumn.count({ where: { projectId } });
}

export async function createColumn(projectId: string, name: string) {
  const last = await db.boardColumn.findFirst({
    where: { projectId },
    select: { position: true },
    orderBy: { position: "desc" },
  });

  return db.boardColumn.create({
    data: {
      projectId,
      name,
      position: (last?.position ?? 0) + POSITION_STEP,
    },
    select: { id: true, name: true, position: true, isDone: true },
  });
}

export function renameColumn(columnId: string, name: string) {
  return db.boardColumn.update({
    where: { id: columnId },
    data: { name },
    select: { id: true, name: true, position: true, isDone: true },
  });
}

export function deleteColumn(columnId: string) {
  return db.boardColumn.delete({ where: { id: columnId } });
}

export function countTasksInColumn(columnId: string) {
  return db.task.count({ where: { columnId } });
}

export function reorderColumns(projectId: string, columnIds: readonly string[]) {
  return db.$transaction(
    columnIds.map((id, index) =>
      db.boardColumn.update({
        where: { id, projectId },
        data: { position: (index + 1) * POSITION_STEP },
        select: { id: true },
      })
    )
  );
}

export function findTaskForMove(taskId: string) {
  return db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      projectId: true,
      columnId: true,
      position: true,
      column: { select: { name: true } },
      assignees: { select: { userId: true } },
      createdById: true,
    },
  });
}

export function findColumnTaskIds(columnId: string) {
  return db.task.findMany({
    where: { columnId },
    select: { id: true },
    orderBy: { position: "asc" },
  });
}

export function moveTask(input: {
  taskId: string;
  toColumnId: string;
  orderedIds: readonly string[];
  completedAt: Date | null;
  markCompletion: boolean;
}) {
  return db.$transaction([
    db.task.update({
      where: { id: input.taskId },
      data: {
        columnId: input.toColumnId,
        ...(input.markCompletion ? { completedAt: input.completedAt } : {}),
      },
      select: { id: true },
    }),
    ...input.orderedIds.map((id, index) =>
      db.task.update({
        where: { id },
        data: { position: (index + 1) * POSITION_STEP },
        select: { id: true },
      })
    ),
  ]);
}

export async function nextTaskPosition(columnId: string) {
  const last = await db.task.findFirst({
    where: { columnId },
    select: { position: true },
    orderBy: { position: "desc" },
  });

  return (last?.position ?? 0) + POSITION_STEP;
}

export function findWorkspaceLabels(workspaceId: string) {
  return db.label.findMany({
    where: { workspaceId },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
}

export function findProjectMembers(projectId: string) {
  return db.projectMember.findMany({
    where: { projectId },
    select: { user: { select: userSelect } },
    orderBy: { joinedAt: "asc" },
  });
}

export function findProjectTasks(projectId: string) {
  return db.task.findMany({
    where: { projectId },
    select: taskCardSelect,
    orderBy: [{ sprintId: { sort: "asc", nulls: "last" } }, { position: "asc" }],
  });
}

export function findWorkspaceIssues(input: {
  workspaceId: string;
  where: Prisma.TaskWhereInput;
  take: number;
  skip: number;
}) {
  return db.task.findMany({
    where: { project: { workspaceId: input.workspaceId }, ...input.where },
    select: {
      ...taskCardSelect,
      projectId: true,
      project: { select: { key: true, name: true } },
      column: { select: { name: true, isDone: true } },
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }],
    take: input.take,
    skip: input.skip,
  });
}

export function countWorkspaceIssues(
  workspaceId: string,
  where: Prisma.TaskWhereInput
) {
  return db.task.count({
    where: { project: { workspaceId }, ...where },
  });
}
