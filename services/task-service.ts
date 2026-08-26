import "server-only";

import { requireProjectAccess } from "@/lib/auth/guards";
import { canModifyTask, hasAtLeastRole, PERMISSIONS, can } from "@/lib/auth/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  ActivityType,
  NotificationType,
  WorkspaceRole,
} from "@/lib/generated/prisma/enums";
import * as activityRepo from "@/repositories/activity-repository";
import * as boardRepo from "@/repositories/board-repository";
import * as repo from "@/repositories/task-repository";
import * as notificationService from "@/services/notification-service";
import type {
  CreateTaskInput,
  DeleteTaskInput,
  UpdateTaskInput,
} from "@/schemas/task";
import type { TaskDetailDTO } from "@/types/dto";

type TaskRecord = NonNullable<Awaited<ReturnType<typeof repo.findTaskById>>>;

function toTaskDetailDTO(task: TaskRecord): TaskDetailDTO {
  return {
    id: task.id,
    projectId: task.projectId,
    columnId: task.columnId,
    column: task.column,
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdBy: task.createdBy,
    assignees: task.assignees.map((a) => a.user),
    labels: task.labels.map((l) => l.label),
    subtasks: {
      completed: task.subtasks.filter((s) => s.isCompleted).length,
      total: task.subtasks.length,
    },
    commentCount: task._count.comments,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function parseDueDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError("That due date is not valid.", {
      dueDate: ["Enter a valid date."],
    });
  }

  return parsed;
}

async function assertMembersAndLabels(
  projectId: string,
  assigneeIds: readonly string[],
  labelIds: readonly string[]
): Promise<void> {
  const [validAssignees, validLabels] = await Promise.all([
    repo.countValidAssignees(projectId, assigneeIds),
    repo.countValidLabels(projectId, labelIds),
  ]);

  if (validAssignees !== assigneeIds.length) {
    throw new ValidationError("You can only assign workspace members.", {
      assigneeIds: ["One or more users are not in this workspace."],
    });
  }

  if (validLabels !== labelIds.length) {
    throw new ValidationError("You can only use labels from this workspace.", {
      labelIds: ["One or more labels do not belong to this workspace."],
    });
  }
}

export async function getTask(taskId: string): Promise<TaskDetailDTO> {
  const task = await repo.findTaskById(taskId);
  if (!task) throw new NotFoundError("Task not found.");

  await requireProjectAccess(task.projectId);

  return toTaskDetailDTO(task);
}

export async function createTask(
  input: CreateTaskInput
): Promise<TaskDetailDTO> {
  const context = await requireProjectAccess(input.projectId);

  if (!can(context.role, PERMISSIONS.TASK_CREATE)) {
    throw new ForbiddenError("You do not have permission to create tasks.");
  }

  const column = await boardRepo.findColumnById(input.columnId);
  if (!column || column.projectId !== input.projectId) {
    throw new NotFoundError("Column not found.");
  }

  await assertMembersAndLabels(
    input.projectId,
    input.assigneeIds,
    input.labelIds
  );

  const task = await repo.createTask({
    projectId: input.projectId,
    columnId: input.columnId,
    title: input.title,
    description: input.description?.trim() || null,
    priority: input.priority,
    position: await boardRepo.nextTaskPosition(input.columnId),
    dueDate: parseDueDate(input.dueDate),
    createdById: context.user.id,
    assigneeIds: input.assigneeIds,
    labelIds: input.labelIds,
  });

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: input.projectId,
    taskId: task.id,
    actorId: context.user.id,
    type: ActivityType.TASK_CREATED,
    metadata: { taskTitle: task.title, column: column.name },
  });

  await notificationService.notify(
    input.assigneeIds.map((recipientId) => ({
      recipientId,
      actorId: context.user.id,
      type: NotificationType.TASK_ASSIGNED,
      title: `${context.user.name} assigned you "${task.title}"`,
      workspaceId: context.workspaceId,
      projectId: input.projectId,
      taskId: task.id,
    })),
    context.user.id
  );

  return toTaskDetailDTO(task);
}

export async function updateTask(
  input: UpdateTaskInput
): Promise<TaskDetailDTO> {
  const existing = await repo.findTaskOwnership(input.taskId);
  if (!existing) throw new NotFoundError("Task not found.");

  const context = await requireProjectAccess(existing.projectId);

  const allowed = canModifyTask(context.role, context.user.id, {
    createdById: existing.createdById,
    assigneeIds: existing.assignees.map((a) => a.userId),
  });

  if (!allowed) {
    throw new ForbiddenError(
      "You can only edit tasks you created or are assigned to."
    );
  }

  await assertMembersAndLabels(
    existing.projectId,
    input.assigneeIds,
    input.labelIds
  );

  const task = await repo.updateTask({
    taskId: input.taskId,
    title: input.title,
    description: input.description?.trim() || null,
    priority: input.priority,
    dueDate: parseDueDate(input.dueDate),
    assigneeIds: input.assigneeIds,
    labelIds: input.labelIds,
  });

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: existing.projectId,
    taskId: task.id,
    actorId: context.user.id,
    type: ActivityType.TASK_UPDATED,
    metadata: { taskTitle: task.title },
  });

  const previousAssignees = new Set(existing.assignees.map((a) => a.userId));
  const newlyAssigned = input.assigneeIds.filter(
    (id) => !previousAssignees.has(id)
  );

  await notificationService.notify(
    newlyAssigned.map((recipientId) => ({
      recipientId,
      actorId: context.user.id,
      type: NotificationType.TASK_ASSIGNED,
      title: `${context.user.name} assigned you "${task.title}"`,
      workspaceId: context.workspaceId,
      projectId: existing.projectId,
      taskId: task.id,
    })),
    context.user.id
  );

  return toTaskDetailDTO(task);
}

export async function deleteTask(input: DeleteTaskInput): Promise<void> {
  const existing = await repo.findTaskOwnership(input.taskId);
  if (!existing) throw new NotFoundError("Task not found.");

  const context = await requireProjectAccess(existing.projectId);

  const isCreator = existing.createdById === context.user.id;
  const isManager = hasAtLeastRole(context.role, WorkspaceRole.ADMIN);

  if (!isCreator && !isManager) {
    throw new ForbiddenError("You do not have permission to delete this task.");
  }

  const task = await repo.findTaskById(input.taskId);
  await repo.deleteTask(input.taskId);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: existing.projectId,
    actorId: context.user.id,
    type: ActivityType.TASK_DELETED,
    metadata: { taskTitle: task?.title ?? "" },
  });
}

export async function canViewerEditTask(taskId: string): Promise<boolean> {
  const task = await repo.findTaskOwnership(taskId);
  if (!task) return false;

  const context = await requireProjectAccess(task.projectId);

  return canModifyTask(context.role, context.user.id, {
    createdById: task.createdById,
    assigneeIds: task.assignees.map((a) => a.userId),
  });
}
