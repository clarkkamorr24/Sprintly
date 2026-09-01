import "server-only";

import { db } from "@/lib/db";
import type { ActivityType } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { userSelect } from "@/repositories/workspace-repository";

export interface ActivityInput {
  readonly workspaceId: string;
  readonly projectId?: string | null;
  readonly taskId?: string | null;
  readonly actorId: string;
  readonly type: ActivityType;
  readonly metadata?: Prisma.InputJsonValue;
}

export function recordActivity(input: ActivityInput) {
  return db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
      actorId: input.actorId,
      type: input.type,
      metadata: input.metadata ?? {},
    },
    select: { id: true },
  });
}

export function findTaskActivity(taskId: string, take: number, skip: number) {
  return db.activityLog.findMany({
    where: { taskId },
    select: {
      id: true,
      type: true,
      metadata: true,
      createdAt: true,
      actor: { select: userSelect },
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
}

export function countTaskActivity(taskId: string) {
  return db.activityLog.count({ where: { taskId } });
}
