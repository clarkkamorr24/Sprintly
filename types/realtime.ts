export const REALTIME_EVENT = {
  BOARD_CHANGED: "board-changed",
  TASK_CHANGED: "task-changed",
  NOTIFICATION_CREATED: "notification-created",
} as const;

export type RealtimeEvent =
  (typeof REALTIME_EVENT)[keyof typeof REALTIME_EVENT];

export interface BoardChangedPayload {
  readonly projectId: string;
  readonly actorId: string;
}

export interface TaskChangedPayload {
  readonly projectId: string;
  readonly taskId: string;
  readonly actorId: string;
}

export interface NotificationCreatedPayload {
  readonly recipientId: string;
}

export function projectChannel(projectId: string): string {
  return `project:${projectId}`;
}

export function userChannel(userId: string): string {
  return `user:${userId}`;
}
