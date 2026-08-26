import "server-only";

import { requireUser } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { broadcastNotificationCreated } from "@/lib/realtime/server";
import * as repo from "@/repositories/notification-repository";
import type {
  DeleteNotificationInput,
  ListNotificationsInput,
  MarkNotificationReadInput,
} from "@/schemas/notification";
import type { Paginated } from "@/types/api";
import type { NotificationDTO } from "@/types/dto";

type NotificationRecord = Awaited<
  ReturnType<typeof repo.findNotifications>
>[number];

function linkFor(notification: NotificationRecord): string | null {
  if (notification.projectId) return `/projects/${notification.projectId}`;
  if (notification.workspaceId) return `/workspaces/${notification.workspaceId}`;
  return null;
}

function toNotificationDTO(notification: NotificationRecord): NotificationDTO {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    actor: notification.actor,
    isRead: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
    href: linkFor(notification),
  };
}

export async function listNotifications(
  input: ListNotificationsInput
): Promise<Paginated<NotificationDTO>> {
  const user = await requireUser();

  const [notifications, total] = await Promise.all([
    repo.findNotifications({
      recipientId: user.id,
      unreadOnly: input.unreadOnly,
      take: input.pageSize,
      skip: (input.page - 1) * input.pageSize,
    }),
    repo.countNotifications(user.id, input.unreadOnly),
  ]);

  return {
    items: notifications.map(toNotificationDTO),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getUnreadCount(): Promise<number> {
  const user = await requireUser();
  return repo.countUnread(user.id);
}

export async function markRead(
  input: MarkNotificationReadInput
): Promise<number> {
  const user = await requireUser();

  const { count } = await repo.markRead(input.notificationId, user.id);
  if (count === 0) throw new NotFoundError("Notification not found.");

  return repo.countUnread(user.id);
}

export async function markAllRead(): Promise<void> {
  const user = await requireUser();
  await repo.markAllRead(user.id);
}

export async function deleteNotification(
  input: DeleteNotificationInput
): Promise<number> {
  const user = await requireUser();

  const { count } = await repo.deleteNotification(input.notificationId, user.id);
  if (count === 0) throw new NotFoundError("Notification not found.");

  return repo.countUnread(user.id);
}

export async function notify(
  inputs: readonly repo.NotificationInput[],
  actorId: string
): Promise<void> {
  const seen = new Set<string>();

  const deliverable = inputs.filter((input) => {
    if (input.recipientId === actorId) return false;
    const key = `${input.recipientId}:${input.type}:${input.taskId ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deliverable.length === 0) return;

  await repo.createNotifications(deliverable);

  await Promise.all(
    [...new Set(deliverable.map((n) => n.recipientId))].map((recipientId) =>
      broadcastNotificationCreated({ recipientId })
    )
  );
}
