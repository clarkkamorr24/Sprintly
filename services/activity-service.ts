import "server-only";

import { requireProjectAccess } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import * as repo from "@/repositories/activity-repository";
import * as taskRepo from "@/repositories/task-repository";
import type { Paginated } from "@/types/api";
import type { ActivityEntryDTO } from "@/types/dto";

type ActivityRecord = Awaited<ReturnType<typeof repo.findTaskActivity>>[number];

function toActivityDTO(entry: ActivityRecord): ActivityEntryDTO {
  return {
    id: entry.id,
    type: entry.type,
    actor: entry.actor,
    metadata: (entry.metadata ?? {}) as Record<string, unknown>,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function listTaskActivity(input: {
  taskId: string;
  page: number;
  pageSize: number;
}): Promise<Paginated<ActivityEntryDTO>> {
  const task = await taskRepo.findTaskOwnership(input.taskId);
  if (!task) throw new NotFoundError("Task not found.");

  await requireProjectAccess(task.projectId);

  const [entries, total] = await Promise.all([
    repo.findTaskActivity(
      input.taskId,
      input.pageSize,
      (input.page - 1) * input.pageSize
    ),
    repo.countTaskActivity(input.taskId),
  ]);

  return {
    items: entries.map(toActivityDTO),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}
