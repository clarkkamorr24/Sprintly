import "server-only";

import { db } from "@/lib/db";
import type { TaskPriority } from "@/lib/generated/prisma/enums";
import { userSelect } from "@/repositories/workspace-repository";

const taskDetailSelect = {
  id: true,
  projectId: true,
  columnId: true,
  title: true,
  description: true,
  priority: true,
  position: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: userSelect },
  column: { select: { id: true, name: true, isDone: true } },
  assignees: { select: { user: { select: userSelect } } },
  labels: { select: { label: { select: { id: true, name: true, color: true } } } },
  subtasks: { select: { isCompleted: true } },
  _count: { select: { comments: true } },
} as const;

export function findTaskById(taskId: string) {
  return db.task.findUnique({
    where: { id: taskId },
    select: taskDetailSelect,
  });
}

export function findTaskOwnership(taskId: string) {
  return db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      projectId: true,
      createdById: true,
      assignees: { select: { userId: true } },
    },
  });
}

export function createTask(input: {
  projectId: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  position: number;
  dueDate: Date | null;
  createdById: string;
  assigneeIds: readonly string[];
  labelIds: readonly string[];
}) {
  return db.task.create({
    data: {
      projectId: input.projectId,
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      position: input.position,
      dueDate: input.dueDate,
      createdById: input.createdById,
      assignees: {
        create: input.assigneeIds.map((userId) => ({ userId })),
      },
      labels: {
        create: input.labelIds.map((labelId) => ({ labelId })),
      },
    },
    select: taskDetailSelect,
  });
}

/**
 * Replaces assignees and labels inside one transaction so a task never ends up
 * with a partially applied set.
 */
export function updateTask(input: {
  taskId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: Date | null;
  assigneeIds: readonly string[];
  labelIds: readonly string[];
}) {
  return db.$transaction(async (tx) => {
    await tx.taskAssignee.deleteMany({
      where: { taskId: input.taskId, userId: { notIn: [...input.assigneeIds] } },
    });
    await tx.taskLabel.deleteMany({
      where: { taskId: input.taskId, labelId: { notIn: [...input.labelIds] } },
    });

    for (const userId of input.assigneeIds) {
      await tx.taskAssignee.upsert({
        where: { taskId_userId: { taskId: input.taskId, userId } },
        update: {},
        create: { taskId: input.taskId, userId },
      });
    }

    for (const labelId of input.labelIds) {
      await tx.taskLabel.upsert({
        where: { taskId_labelId: { taskId: input.taskId, labelId } },
        update: {},
        create: { taskId: input.taskId, labelId },
      });
    }

    return tx.task.update({
      where: { id: input.taskId },
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
      },
      select: taskDetailSelect,
    });
  });
}

export function deleteTask(taskId: string) {
  return db.task.delete({ where: { id: taskId } });
}

export function countValidAssignees(
  projectId: string,
  userIds: readonly string[]
) {
  if (userIds.length === 0) return Promise.resolve(0);

  return db.workspaceMember.count({
    where: {
      userId: { in: [...userIds] },
      workspace: { projects: { some: { id: projectId } } },
    },
  });
}

export function countValidLabels(projectId: string, labelIds: readonly string[]) {
  if (labelIds.length === 0) return Promise.resolve(0);

  return db.label.count({
    where: {
      id: { in: [...labelIds] },
      workspace: { projects: { some: { id: projectId } } },
    },
  });
}
