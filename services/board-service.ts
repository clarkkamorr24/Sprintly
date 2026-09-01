import "server-only";

import {
  requireProjectAccess,
  requireProjectPermission,
  requireWorkspaceAccess,
} from "@/lib/auth/guards";
import { canModifyTask, PERMISSIONS } from "@/lib/auth/permissions";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  ActivityType,
  NotificationType,
  SprintStatus,
} from "@/lib/generated/prisma/enums";
import * as activityRepo from "@/repositories/activity-repository";
import * as repo from "@/repositories/board-repository";
import * as notificationService from "@/services/notification-service";
import { listSprints } from "@/services/sprint-service";
import { PAGE_SIZE } from "@/lib/constants";
import type { BoardFilters, WorkspaceIssueFilters } from "@/schemas/task";
import type {
  CreateColumnInput,
  DeleteColumnInput,
  MoveTaskInput,
  RenameColumnInput,
  ReorderColumnsInput,
} from "@/schemas/board";
import type {
  BoardColumnDTO,
  BoardDTO,
  LabelDTO,
  SprintDTO,
  TaskCardDTO,
  UserDTO,
  WorkspaceIssueDTO,
} from "@/types/dto";
import type { Prisma } from "@prisma/client";
import type { Paginated } from "@/types/api";

const MAX_COLUMNS = 12;

function toTaskCardDTO(task: repo.TaskCardRecord): TaskCardDTO {
  return {
    id: task.id,
    columnId: task.columnId,
    key: `${task.project.key}-${task.number}`,
    type: task.type,
    storyPoints: task.storyPoints,
    title: task.title,
    priority: task.priority,
    position: task.position,
    dueDate: task.dueDate?.toISOString() ?? null,
    assignees: task.assignees.map((a) => a.user),
    labels: task.labels.map((l) => l.label),
    subtasks: {
      completed: task.subtasks.filter((s) => s.isCompleted).length,
      total: task.subtasks.length,
    },
    commentCount: task._count.comments,
    hasDescription: Boolean(task.description?.trim()),
    sprintId: task.sprintId,
    sprintName: task.sprint?.name ?? null,
  };
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function buildTaskFilter(filters: BoardFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};

  if (filters.assigneeId) {
    where.assignees = { some: { userId: filters.assigneeId } };
  }
  if (filters.priority) where.priority = filters.priority;
  if (filters.labelId) where.labels = { some: { labelId: filters.labelId } };
  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }

  if (filters.due) {
    const today = startOfToday();

    if (filters.due === "overdue") {
      where.dueDate = { lt: today };
      where.completedAt = null;
    } else if (filters.due === "today") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.dueDate = { gte: today, lt: tomorrow };
    } else {
      const inAWeek = new Date(today);
      inAWeek.setDate(inAWeek.getDate() + 7);
      where.dueDate = { gte: today, lt: inAWeek };
    }
  }

  return where;
}

export async function getBoard(
  projectId: string,
  filters: BoardFilters = {}
): Promise<BoardDTO> {
  await requireProjectAccess(projectId);

  const columns = await repo.findBoard(projectId, buildTaskFilter(filters));

  return {
    projectId,
    columns: columns.map<BoardColumnDTO>((column) => ({
      id: column.id,
      name: column.name,
      position: column.position,
      isDone: column.isDone,
      tasks: column.tasks.map(toTaskCardDTO),
    })),
  };
}

export async function getBoardMeta(projectId: string): Promise<{
  members: readonly UserDTO[];
  labels: readonly LabelDTO[];
}> {
  const context = await requireProjectAccess(projectId);

  const [members, labels] = await Promise.all([
    repo.findProjectMembers(projectId),
    repo.findWorkspaceLabels(context.workspaceId),
  ]);

  return { members: members.map((m) => m.user), labels };
}

export async function createColumn(input: CreateColumnInput) {
  const context = await requireProjectPermission(
    input.projectId,
    PERMISSIONS.BOARD_MANAGE
  );

  if ((await repo.countColumns(input.projectId)) >= MAX_COLUMNS) {
    throw new ConflictError(`A board can have at most ${MAX_COLUMNS} columns.`);
  }

  const column = await repo.createColumn(input.projectId, input.name);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: input.projectId,
    actorId: context.user.id,
    type: ActivityType.COLUMN_CREATED,
    metadata: { columnName: column.name },
  });

  return column;
}

export async function renameColumn(input: RenameColumnInput) {
  const column = await repo.findColumnById(input.columnId);
  if (!column) throw new NotFoundError("Column not found.");

  const context = await requireProjectPermission(
    column.projectId,
    PERMISSIONS.BOARD_MANAGE
  );

  const previousName = column.name;
  const updated = await repo.renameColumn(input.columnId, input.name);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: column.projectId,
    actorId: context.user.id,
    type: ActivityType.COLUMN_RENAMED,
    metadata: { from: previousName, to: updated.name },
  });

  return updated;
}

export async function deleteColumn(input: DeleteColumnInput): Promise<void> {
  const column = await repo.findColumnById(input.columnId);
  if (!column) throw new NotFoundError("Column not found.");

  const context = await requireProjectPermission(
    column.projectId,
    PERMISSIONS.BOARD_MANAGE
  );

  if ((await repo.countColumns(column.projectId)) <= 1) {
    throw new ConflictError("A board must keep at least one column.");
  }

  if ((await repo.countTasksInColumn(input.columnId)) > 0) {
    throw new ConflictError(
      "Move or delete the tasks in this column before deleting it."
    );
  }

  await repo.deleteColumn(input.columnId);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: column.projectId,
    actorId: context.user.id,
    type: ActivityType.COLUMN_DELETED,
    metadata: { columnName: column.name },
  });
}

export async function reorderColumns(input: ReorderColumnsInput): Promise<void> {
  const context = await requireProjectPermission(
    input.projectId,
    PERMISSIONS.BOARD_MANAGE
  );

  const existing = await repo.findColumnIds(input.projectId);
  const existingIds = new Set(existing.map((c) => c.id));

  const sameLength = existingIds.size === input.columnIds.length;
  const allBelong = input.columnIds.every((id) => existingIds.has(id));

  if (!sameLength || !allBelong) {
    throw new ConflictError("The board changed. Refresh and try again.");
  }

  await repo.reorderColumns(input.projectId, input.columnIds);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: input.projectId,
    actorId: context.user.id,
    type: ActivityType.COLUMN_REORDERED,
    metadata: {},
  });
}

export async function moveTask(
  input: MoveTaskInput
): Promise<{ projectId: string; actorId: string }> {
  const task = await repo.findTaskForMove(input.taskId);
  if (!task) throw new NotFoundError("Task not found.");

  const context = await requireProjectAccess(task.projectId);

  const canMove = canModifyTask(context.role, context.user.id, {
    createdById: task.createdById,
    assigneeIds: task.assignees.map((a) => a.userId),
  });

  if (!canMove) {
    throw new ForbiddenError("You can only move tasks you created or are assigned to.");
  }

  const targetColumn = await repo.findColumnById(input.toColumnId);
  if (!targetColumn || targetColumn.projectId !== task.projectId) {
    throw new NotFoundError("Column not found.");
  }

  const destinationIds = (await repo.findColumnTaskIds(input.toColumnId)).map(
    (t) => t.id
  );

  const withoutTask = destinationIds.filter((id) => id !== input.taskId);
  const index = Math.min(input.toIndex, withoutTask.length);
  const orderedIds = [
    ...withoutTask.slice(0, index),
    input.taskId,
    ...withoutTask.slice(index),
  ];

  const changedColumn = task.columnId !== input.toColumnId;

  await repo.moveTask({
    taskId: input.taskId,
    toColumnId: input.toColumnId,
    orderedIds,
    completedAt: targetColumn.isDone ? new Date() : null,
    markCompletion: changedColumn,
  });

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: task.projectId,
    taskId: task.id,
    actorId: context.user.id,
    type: changedColumn ? ActivityType.TASK_MOVED : ActivityType.TASK_UPDATED,
    metadata: changedColumn
      ? { taskTitle: task.title, from: task.column.name, to: targetColumn.name }
      : { taskTitle: task.title, reordered: true },
  });

  if (changedColumn) {
    await notificationService.notify(
      task.assignees.map((assignee) => ({
        recipientId: assignee.userId,
        actorId: context.user.id,
        type: NotificationType.TASK_STATUS_CHANGED,
        title: `${context.user.name} moved "${task.title}" to ${targetColumn.name}`,
        workspaceId: context.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
      })),
      context.user.id
    );
  }

  return { projectId: task.projectId, actorId: context.user.id };
}

export interface BacklogGroup {
  readonly sprint: SprintDTO | null;
  readonly tasks: readonly TaskCardDTO[];
  readonly points: number;
}

export async function getBacklog(
  projectId: string
): Promise<readonly BacklogGroup[]> {
  await requireProjectAccess(projectId);

  const [tasks, sprints] = await Promise.all([
    repo.findProjectTasks(projectId),
    listSprints(projectId),
  ]);

  const cards = tasks.map(toTaskCardDTO);
  const openSprints = sprints.filter(
    (sprint) => sprint.status !== SprintStatus.COMPLETED
  );

  const groups: BacklogGroup[] = openSprints.map((sprint) => {
    const owned = cards.filter((task) => task.sprintId === sprint.id);
    return {
      sprint,
      tasks: owned,
      points: owned.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
    };
  });

  const sprintIds = new Set(openSprints.map((sprint) => sprint.id));
  const unassigned = cards.filter(
    (task) => !task.sprintId || !sprintIds.has(task.sprintId)
  );

  groups.push({
    sprint: null,
    tasks: unassigned,
    points: unassigned.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
  });

  return groups;
}

export async function listWorkspaceIssues(
  workspaceId: string,
  filters: WorkspaceIssueFilters
): Promise<Paginated<WorkspaceIssueDTO>> {
  await requireWorkspaceAccess(workspaceId);

  const where: Prisma.TaskWhereInput = buildTaskFilter(filters);

  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.status === "open") where.completedAt = null;
  if (filters.status === "done") where.completedAt = { not: null };

  const take = PAGE_SIZE.DEFAULT;
  const skip = (filters.page - 1) * take;

  const [issues, total] = await Promise.all([
    repo.findWorkspaceIssues({ workspaceId, where, take, skip }),
    repo.countWorkspaceIssues(workspaceId, where),
  ]);

  return {
    items: issues.map((issue) => ({
      ...toTaskCardDTO(issue),
      projectId: issue.projectId,
      projectKey: issue.project.key,
      projectName: issue.project.name,
      columnName: issue.column.name,
      isDone: issue.column.isDone,
      updatedAt: issue.updatedAt.toISOString(),
    })),
    total,
    page: filters.page,
    pageSize: take,
  };
}
