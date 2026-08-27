import "server-only";

import { db } from "@/lib/db";
import type { IssueType, TaskPriority } from "@/lib/generated/prisma/enums";
import { userSelect } from "@/repositories/workspace-repository";

const taskDetailSelect = {
  id: true,
  projectId: true,
  columnId: true,
  number: true,
  type: true,
  storyPoints: true,
  title: true,
  project: { select: { key: true } },
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
      title: true,
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
  type: IssueType;
  priority: TaskPriority;
  storyPoints: number | null;
  position: number;
  dueDate: Date | null;
  createdById: string;
  assigneeIds: readonly string[];
  labelIds: readonly string[];
}) {
  return db.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id: input.projectId },
      data: { issueCounter: { increment: 1 } },
      select: { issueCounter: true },
    });

    return tx.task.create({
      data: {
        number: project.issueCounter,
        type: input.type,
        storyPoints: input.storyPoints,
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
  });
}

export function updateTask(input: {
  taskId: string;
  title: string;
  description: string | null;
  type: IssueType;
  priority: TaskPriority;
  storyPoints: number | null;
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
        type: input.type,
        priority: input.priority,
        storyPoints: input.storyPoints,
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
