import "server-only";

import { requireProjectAccess, requireProjectPermission } from "@/lib/auth/guards";
import { canModifyTask, PERMISSIONS } from "@/lib/auth/permissions";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import { BACKLOG_COLUMN_NAME } from "@/lib/constants";
import * as boardRepo from "@/repositories/board-repository";
import * as repo from "@/repositories/sprint-repository";
import * as taskRepo from "@/repositories/task-repository";
import type {
  AssignTaskToSprintInput,
  ChangeSprintStatusInput,
  CreateSprintInput,
  DeleteSprintInput,
  UpdateSprintInput,
} from "@/schemas/sprint";
import type { SprintDTO } from "@/types/dto";

type SprintRecord = NonNullable<Awaited<ReturnType<typeof repo.findSprintById>>>;

async function toSprintDTO(sprint: SprintRecord): Promise<SprintDTO> {
  const tasks = await repo.findSprintTaskStats(sprint.id);

  return {
    id: sprint.id,
    projectId: sprint.projectId,
    number: sprint.number,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    taskCount: tasks.length,
    completedCount: tasks.filter((task) => task.column.isDone).length,
  };
}

export async function listSprints(
  projectId: string
): Promise<readonly SprintDTO[]> {
  await requireProjectAccess(projectId);

  const sprints = await repo.findSprints(projectId);
  return Promise.all(sprints.map(toSprintDTO));
}

export async function createSprint(
  input: CreateSprintInput
): Promise<SprintDTO> {
  await requireProjectPermission(input.projectId, PERMISSIONS.BOARD_MANAGE);

  const sprint = await repo.createSprint({
    projectId: input.projectId,
    name: input.name,
    goal: input.goal?.trim() || null,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });

  return toSprintDTO(sprint);
}

export async function updateSprint(
  input: UpdateSprintInput
): Promise<SprintDTO> {
  const existing = await repo.findSprintById(input.sprintId);
  if (!existing) throw new NotFoundError("Sprint not found.");

  await requireProjectPermission(existing.projectId, PERMISSIONS.BOARD_MANAGE);

  const sprint = await repo.updateSprint(input.sprintId, {
    name: input.name,
    goal: input.goal?.trim() || null,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });

  return toSprintDTO(sprint);
}

export async function changeSprintStatus(
  input: ChangeSprintStatusInput
): Promise<SprintDTO> {
  const existing = await repo.findSprintById(input.sprintId);
  if (!existing) throw new NotFoundError("Sprint not found.");

  await requireProjectPermission(existing.projectId, PERMISSIONS.BOARD_MANAGE);

  if (input.status === SprintStatus.ACTIVE) {
    const active = await repo.findActiveSprint(existing.projectId);
    if (active && active.id !== existing.id) {
      throw new ConflictError(
        `"${active.name}" is already active. Complete it before starting another.`
      );
    }
  }

  if (input.status === SprintStatus.COMPLETED) {
    await repo.moveIncompleteTasksToBacklog(input.sprintId);
  }

  return toSprintDTO(await repo.setSprintStatus(input.sprintId, input.status));
}

export async function deleteSprint(input: DeleteSprintInput): Promise<void> {
  const existing = await repo.findSprintById(input.sprintId);
  if (!existing) throw new NotFoundError("Sprint not found.");

  await requireProjectPermission(existing.projectId, PERMISSIONS.BOARD_MANAGE);

  if (existing.status === SprintStatus.ACTIVE) {
    throw new ConflictError("Complete the sprint before deleting it.");
  }

  await repo.deleteSprint(input.sprintId);
}

export async function assignTaskToSprint(
  input: AssignTaskToSprintInput
): Promise<void> {
  const task = await taskRepo.findTaskOwnership(input.taskId);
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

  if (input.sprintId) {
    const sprint = await repo.findSprintById(input.sprintId);
    if (!sprint || sprint.projectId !== task.projectId) {
      throw new NotFoundError("Sprint not found.");
    }
    if (sprint.status === SprintStatus.COMPLETED) {
      throw new ConflictError("That sprint is already completed.");
    }
  }

  const column = await boardRepo.findColumnById(task.columnId);
  const isBacklog =
    column?.name.toLowerCase() === BACKLOG_COLUMN_NAME.toLowerCase();

  let columnId: string | undefined;

  if (input.sprintId) {
    if (!column || isBacklog) {
      const entry = await boardRepo.findEntryColumn(task.projectId);
      if (entry) columnId = entry.id;
    }
  } else if (column && !column.isDone && !isBacklog) {
    columnId = (await boardRepo.findOrCreateBacklogColumn(task.projectId)).id;
  }

  await repo.assignTaskToSprint(input.taskId, input.sprintId, columnId);
}
