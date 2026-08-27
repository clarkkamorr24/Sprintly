import "server-only";

import { db } from "@/lib/db";
import type { NotificationType } from "@/lib/generated/prisma/enums";
import { userSelect } from "@/repositories/workspace-repository";

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  readAt: true,
  createdAt: true,
  workspaceId: true,
  projectId: true,
  taskId: true,
  actor: { select: userSelect },
} as const;

export function findNotifications(input: {
  recipientId: string;
  unreadOnly: boolean;
  take: number;
  skip: number;
}) {
  return db.notification.findMany({
    where: {
      recipientId: input.recipientId,
      ...(input.unreadOnly ? { readAt: null } : {}),
    },
    select: notificationSelect,
    orderBy: { createdAt: "desc" },
    take: input.take,
    skip: input.skip,
  });
}

export function countNotifications(recipientId: string, unreadOnly: boolean) {
  return db.notification.count({
    where: { recipientId, ...(unreadOnly ? { readAt: null } : {}) },
  });
}

export function countUnread(recipientId: string) {
  return db.notification.count({ where: { recipientId, readAt: null } });
}

export function markRead(notificationId: string, recipientId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, recipientId },
    data: { readAt: new Date() },
  });
}

export function markAllRead(recipientId: string) {
  return db.notification.updateMany({
    where: { recipientId, readAt: null },
    data: { readAt: new Date() },
  });
}

export function deleteNotification(notificationId: string, recipientId: string) {
  return db.notification.deleteMany({
    where: { id: notificationId, recipientId },
  });
}

export interface NotificationInput {
  readonly recipientId: string;
  readonly actorId: string | null;
  readonly type: NotificationType;
  readonly title: string;
  readonly body?: string | null;
  readonly workspaceId?: string | null;
  readonly projectId?: string | null;
  readonly taskId?: string | null;
}

export function createNotifications(inputs: readonly NotificationInput[]) {
  if (inputs.length === 0) return Promise.resolve({ count: 0 });

  return db.notification.createMany({
    data: inputs.map((input) => ({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      workspaceId: input.workspaceId ?? null,
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
    })),
  });
}
