"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import {
  deleteNotificationAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notification-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { REALTIME_EVENT, userChannel } from "@/types/realtime";
import type { NotificationDTO } from "@/types/dto";
import { RelativeTime } from "@/components/shared/relative-time";

interface NotificationBellProps {
  readonly initialUnreadCount: number;
  readonly currentUserId: string;
}

export function NotificationBell({
  initialUnreadCount,
  currentUserId,
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<
    readonly NotificationDTO[] | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      const result = await listNotificationsAction({
        page: 1,
        pageSize: PAGE_SIZE.NOTIFICATIONS,
        unreadOnly: false,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setNotifications(result.data.items);
    });
  }, []);

  useRealtimeChannel({
    channel: userChannel(currentUserId),
    event: REALTIME_EVENT.NOTIFICATION_CREATED,
    onEvent: () => {
      setUnreadCount((count) => count + 1);
      if (notifications !== null) load();
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (open) load();
  };

  const handleMarkRead = (notification: NotificationDTO) => {
    if (notification.isRead) return;

    startTransition(async () => {
      const result = await markNotificationReadAction({
        notificationId: notification.id,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setUnreadCount(result.data.unreadCount);
      setNotifications(
        (current) =>
          current?.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          ) ?? null
      );
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setUnreadCount(0);
      setNotifications(
        (current) => current?.map((n) => ({ ...n, isRead: true })) ?? null
      );
    });
  };

  const handleDelete = (notification: NotificationDTO) => {
    startTransition(async () => {
      const result = await deleteNotificationAction({
        notificationId: notification.id,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setUnreadCount(result.data.unreadCount);
      setNotifications(
        (current) => current?.filter((n) => n.id !== notification.id) ?? null
      );
    });
  };

  const label =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications, none unread";

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={label} className="relative">
            <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} />
            {unreadCount > 0 ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />

      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        <Separator />

        <div className="max-h-96 overflow-y-auto">
          {notifications === null ? (
            <div className="space-y-3 p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <span className="sr-only" role="status">
                Loading notifications…
              </span>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              title="You're all caught up"
              description="Notifications about your tasks appear here."
              className="m-3 border-0"
            />
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "group/notification flex items-start gap-2 px-3 py-2.5 hover:bg-muted/60",
                    !notification.isRead && "bg-accent/40"
                  )}
                >
                  <div className="min-w-0 flex-1 space-x-2">
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        onClick={() => handleMarkRead(notification)}
                        className="rounded-sm text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <span
                          className={cn(!notification.isRead && "font-medium")}
                        >
                          {notification.title}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-sm">{notification.title}</span>
                    )}

                    {notification.body ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notification.body}
                      </p>
                    ) : null}

                    <time
                      dateTime={notification.createdAt}
                      className="text-xs text-muted-foreground"
                    >
                      <RelativeTime iso={notification.createdAt} />
                    </time>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {!notification.isRead ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={isPending}
                        onClick={() => handleMarkRead(notification)}
                      >
                        Mark read
                      </Button>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Dismiss notification: ${notification.title}`}
                      disabled={isPending}
                      onClick={() => handleDelete(notification)}
                      className="text-muted-foreground/60 hover:text-destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
