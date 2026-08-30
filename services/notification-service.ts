import "server-only";

import { requireUser } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { NotificationType } from "@/lib/generated/prisma/enums";
import { broadcastNotificationCreated } from "@/lib/realtime/server";
import * as invitationRepo from "@/repositories/invitation-repository";
import * as repo from "@/repositories/notification-repository";
import * as workspaceRepo from "@/repositories/workspace-repository";
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

async function workspaceSlugsById(
  workspaceIds: readonly string[]
): Promise<ReadonlyMap<string, string>> {
  const unique = [...new Set(workspaceIds)];
  if (unique.length === 0) return new Map();

  const workspaces = await workspaceRepo.findWorkspaceSlugs(unique);

  return new Map(workspaces.map((w) => [w.id, w.slug]));
}

async function workspaceSlugsByProject(
  projectIds: readonly string[]
): Promise<ReadonlyMap<string, string>> {
  const unique = [...new Set(projectIds)];
  if (unique.length === 0) return new Map();

  const projects = await workspaceRepo.findWorkspaceSlugsByProject(unique);

  return new Map(projects.map((p) => [p.id, p.workspace.slug]));
}

async function pendingInviteTokens(
  email: string
): Promise<ReadonlyMap<string, string>> {
  const pending = await invitationRepo.findPendingTokensForEmail(
    email.toLowerCase()
  );

  return new Map(pending.map((i) => [i.workspaceId, i.token]));
}

function linkFor(
  notification: NotificationRecord,
  slugByWorkspace: ReadonlyMap<string, string>,
  slugByProject: ReadonlyMap<string, string>,
  inviteTokenByWorkspace: ReadonlyMap<string, string>
): string | null {
  if (
    notification.type === NotificationType.WORKSPACE_INVITATION &&
    notification.workspaceId
  ) {
    const token = inviteTokenByWorkspace.get(notification.workspaceId);
    if (token) return `/invitations/${token}`;
  }

  if (notification.taskId && notification.projectId) {
    const slug = slugByProject.get(notification.projectId);
    return slug
      ? `/workspaces/${slug}/board?task=${notification.taskId}`
      : null;
  }

  if (notification.projectId) {
    const slug = slugByProject.get(notification.projectId);
    return slug ? `/workspaces/${slug}/board` : null;
  }

  if (notification.workspaceId) {
    const slug = slugByWorkspace.get(notification.workspaceId);
    return slug ? `/workspaces/${slug}` : null;
  }

  return null;
}

function toNotificationDTO(
  notification: NotificationRecord,
  slugByWorkspace: ReadonlyMap<string, string>,
  slugByProject: ReadonlyMap<string, string>,
  inviteTokenByWorkspace: ReadonlyMap<string, string>
): NotificationDTO {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    actor: notification.actor,
    isRead: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
    href: linkFor(
      notification,
      slugByWorkspace,
      slugByProject,
      inviteTokenByWorkspace
    ),
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

  const hasInvitation = notifications.some(
    (n) => n.type === NotificationType.WORKSPACE_INVITATION
  );

  const [slugByWorkspace, slugByProject, inviteTokenByWorkspace] = await Promise.all([
    workspaceSlugsById(
      notifications
        .map((notification) => notification.workspaceId)
        .filter((id): id is string => id !== null)
    ),
    workspaceSlugsByProject(
      notifications
        .map((notification) => notification.projectId)
        .filter((id): id is string => id !== null)
    ),
    hasInvitation
      ? pendingInviteTokens(user.email)
      : Promise.resolve<ReadonlyMap<string, string>>(new Map()),
  ]);

  return {
    items: notifications.map((notification) =>
      toNotificationDTO(
        notification,
        slugByWorkspace,
        slugByProject,
        inviteTokenByWorkspace
      )
    ),
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
