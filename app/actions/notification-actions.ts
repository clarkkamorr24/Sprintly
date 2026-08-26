"use server";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as notificationService from "@/services/notification-service";
import {
  deleteNotificationSchema,
  listNotificationsSchema,
  markNotificationReadSchema,
} from "@/schemas/notification";
import type { ApiResponse, Paginated } from "@/types/api";
import type { NotificationDTO } from "@/types/dto";

export async function listNotificationsAction(
  input: unknown
): Promise<ApiResponse<Paginated<NotificationDTO>>> {
  return handleAction("listNotificationsAction", async () => {
    const data = parseInput(listNotificationsSchema, input);
    return notificationService.listNotifications(data);
  });
}

export async function markNotificationReadAction(
  input: unknown
): Promise<ApiResponse<{ unreadCount: number }>> {
  return handleAction("markNotificationReadAction", async () => {
    const data = parseInput(markNotificationReadSchema, input);
    const unreadCount = await notificationService.markRead(data);
    return { unreadCount };
  });
}

export async function markAllNotificationsReadAction(): Promise<
  ApiResponse<{ unreadCount: number }>
> {
  return handleAction("markAllNotificationsReadAction", async () => {
    await notificationService.markAllRead();
    return { unreadCount: 0 };
  });
}

export async function deleteNotificationAction(
  input: unknown
): Promise<ApiResponse<{ unreadCount: number }>> {
  return handleAction("deleteNotificationAction", async () => {
    const data = parseInput(deleteNotificationSchema, input);
    const unreadCount = await notificationService.deleteNotification(data);
    return { unreadCount };
  });
}
