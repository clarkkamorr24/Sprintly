import "server-only";

import { POSITION_STEP } from "@/lib/constants";
import { db } from "@/lib/db";
import { userSelect } from "@/repositories/workspace-repository";

const subtaskSelect = {
  id: true,
  title: true,
  isCompleted: true,
  position: true,
  dueDate: true,
  assignee: { select: userSelect },
} as const;

export function findSubtasks(taskId: string) {
  return db.subtask.findMany({
    where: { taskId },
    select: subtaskSelect,
    orderBy: { position: "asc" },
  });
}

export function findSubtaskWithTask(subtaskId: string) {
  return db.subtask.findUnique({
    where: { id: subtaskId },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      taskId: true,
      task: {
        select: {
          id: true,
          title: true,
          projectId: true,
          createdById: true,
          assignees: { select: { userId: true } },
        },
      },
    },
  });
}

export async function createSubtask(taskId: string, title: string) {
  const last = await db.subtask.findFirst({
    where: { taskId },
    select: { position: true },
    orderBy: { position: "desc" },
  });

  return db.subtask.create({
    data: {
      taskId,
      title,
      position: (last?.position ?? 0) + POSITION_STEP,
    },
    select: subtaskSelect,
  });
}

export function updateSubtaskTitle(subtaskId: string, title: string) {
  return db.subtask.update({
    where: { id: subtaskId },
    data: { title },
    select: subtaskSelect,
  });
}

export function setSubtaskCompletion(subtaskId: string, isCompleted: boolean) {
  return db.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted },
    select: subtaskSelect,
  });
}

export function deleteSubtask(subtaskId: string) {
  return db.subtask.delete({ where: { id: subtaskId } });
}

export function reorderSubtasks(taskId: string, subtaskIds: readonly string[]) {
  return db.$transaction(
    subtaskIds.map((id, index) =>
      db.subtask.update({
        where: { id, taskId },
        data: { position: (index + 1) * POSITION_STEP },
        select: { id: true },
      })
    )
  );
}

export function countSubtasks(taskId: string) {
  return db.subtask.count({ where: { taskId } });
}
