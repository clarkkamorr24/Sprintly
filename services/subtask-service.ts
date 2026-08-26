import "server-only";

import { requireProjectAccess } from "@/lib/auth/guards";
import { canModifyTask } from "@/lib/auth/permissions";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { ActivityType } from "@/lib/generated/prisma/enums";
import * as activityRepo from "@/repositories/activity-repository";
import * as repo from "@/repositories/subtask-repository";
import * as taskRepo from "@/repositories/task-repository";
import type {
  CreateSubtaskInput,
  DeleteSubtaskInput,
  ReorderSubtasksInput,
  ToggleSubtaskInput,
  UpdateSubtaskInput,
} from "@/schemas/subtask";
import type { SubtaskDTO } from "@/types/dto";

const MAX_SUBTASKS = 50;

type SubtaskRecord = Awaited<ReturnType<typeof repo.findSubtasks>>[number];

function toSubtaskDTO(subtask: SubtaskRecord): SubtaskDTO {
  return {
    id: subtask.id,
    title: subtask.title,
    isCompleted: subtask.isCompleted,
    position: subtask.position,
    assignee: subtask.assignee,
    dueDate: subtask.dueDate?.toISOString() ?? null,
  };
}

/**
 * Subtasks inherit the parent task's permissions: whoever may edit the task
 * may manage its checklist.
 */
async function requireTaskEditable(taskId: string) {
  const task = await taskRepo.findTaskOwnership(taskId);
  if (!task) throw new NotFoundError("Task not found.");

  const context = await requireProjectAccess(task.projectId);

  const allowed = canModifyTask(context.role, context.user.id, {
    createdById: task.createdById,
    assigneeIds: task.assignees.map((a) => a.userId),
  });

  if (!allowed) {
    throw new ForbiddenError(
      "You can only change tasks you created or are assigned to."
    );
  }

  return { context, task };
}

export async function listSubtasks(
  taskId: string
): Promise<readonly SubtaskDTO[]> {
  const task = await taskRepo.findTaskOwnership(taskId);
  if (!task) throw new NotFoundError("Task not found.");

  await requireProjectAccess(task.projectId);

  return (await repo.findSubtasks(taskId)).map(toSubtaskDTO);
}

export async function createSubtask(
  input: CreateSubtaskInput
): Promise<SubtaskDTO> {
  const { context, task } = await requireTaskEditable(input.taskId);

  if ((await repo.countSubtasks(input.taskId)) >= MAX_SUBTASKS) {
    throw new ConflictError(`A task can have at most ${MAX_SUBTASKS} subtasks.`);
  }

  const subtask = await repo.createSubtask(input.taskId, input.title);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: task.projectId,
    taskId: input.taskId,
    actorId: context.user.id,
    type: ActivityType.SUBTASK_CREATED,
    metadata: { subtaskTitle: subtask.title },
  });

  return toSubtaskDTO(subtask);
}

export async function updateSubtask(
  input: UpdateSubtaskInput
): Promise<SubtaskDTO> {
  const existing = await repo.findSubtaskWithTask(input.subtaskId);
  if (!existing) throw new NotFoundError("Subtask not found.");

  await requireTaskEditable(existing.taskId);

  return toSubtaskDTO(
    await repo.updateSubtaskTitle(input.subtaskId, input.title)
  );
}

export async function toggleSubtask(
  input: ToggleSubtaskInput
): Promise<SubtaskDTO> {
  const existing = await repo.findSubtaskWithTask(input.subtaskId);
  if (!existing) throw new NotFoundError("Subtask not found.");

  const { context } = await requireTaskEditable(existing.taskId);

  const subtask = await repo.setSubtaskCompletion(
    input.subtaskId,
    input.isCompleted
  );

  if (input.isCompleted) {
    await activityRepo.recordActivity({
      workspaceId: context.workspaceId,
      projectId: existing.task.projectId,
      taskId: existing.taskId,
      actorId: context.user.id,
      type: ActivityType.SUBTASK_COMPLETED,
      metadata: { subtaskTitle: subtask.title },
    });
  }

  return toSubtaskDTO(subtask);
}

export async function deleteSubtask(input: DeleteSubtaskInput): Promise<void> {
  const existing = await repo.findSubtaskWithTask(input.subtaskId);
  if (!existing) throw new NotFoundError("Subtask not found.");

  const { context } = await requireTaskEditable(existing.taskId);

  await repo.deleteSubtask(input.subtaskId);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: existing.task.projectId,
    taskId: existing.taskId,
    actorId: context.user.id,
    type: ActivityType.SUBTASK_DELETED,
    metadata: { subtaskTitle: existing.title },
  });
}

export async function reorderSubtasks(
  input: ReorderSubtasksInput
): Promise<void> {
  await requireTaskEditable(input.taskId);

  const existing = await repo.findSubtasks(input.taskId);
  const existingIds = new Set(existing.map((s) => s.id));

  const matches =
    existingIds.size === input.subtaskIds.length &&
    input.subtaskIds.every((id) => existingIds.has(id));

  if (!matches) {
    throw new ConflictError("The checklist changed. Refresh and try again.");
  }

  await repo.reorderSubtasks(input.taskId, input.subtaskIds);
}
