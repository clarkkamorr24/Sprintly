import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  BoardChangedPayload,
  NotificationCreatedPayload,
  TaskChangedPayload,
} from "@/types/realtime";
import {
  REALTIME_EVENT,
  projectChannel,
  userChannel,
} from "@/types/realtime";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

async function broadcast(
  channelName: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  try {
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    await channel.httpSend(event, payload);
    await supabase.removeChannel(channel);
  } catch (error) {
    console.error(`[realtime] broadcast to ${channelName} failed:`, error);
  }
}

export function broadcastBoardChanged(
  payload: BoardChangedPayload
): Promise<void> {
  return broadcast(
    projectChannel(payload.projectId),
    REALTIME_EVENT.BOARD_CHANGED,
    { ...payload }
  );
}

export function broadcastTaskChanged(
  payload: TaskChangedPayload
): Promise<void> {
  return broadcast(
    projectChannel(payload.projectId),
    REALTIME_EVENT.TASK_CHANGED,
    { ...payload }
  );
}

export function broadcastNotificationCreated(
  payload: NotificationCreatedPayload
): Promise<void> {
  return broadcast(
    userChannel(payload.recipientId),
    REALTIME_EVENT.NOTIFICATION_CREATED,
    { ...payload }
  );
}
