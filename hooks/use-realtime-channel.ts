"use client";

import { useEffect, useEffectEvent } from "react";

import { getRealtimeClient } from "@/lib/realtime/client";

interface UseRealtimeChannelOptions {
  readonly channel: string | null;
  readonly event: string;
  readonly onEvent: (payload: Record<string, unknown>) => void;
}

export function useRealtimeChannel({
  channel,
  event,
  onEvent,
}: UseRealtimeChannelOptions): void {
  const handleEvent = useEffectEvent((payload: Record<string, unknown>) => {
    onEvent(payload);
  });

  useEffect(() => {
    if (!channel) return;

    const supabase = getRealtimeClient();
    if (!supabase) return;

    const subscription = supabase
      .channel(channel, { config: { broadcast: { self: false } } })
      .on("broadcast", { event }, (message) => {
        handleEvent((message.payload ?? {}) as Record<string, unknown>);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, event]);
}
