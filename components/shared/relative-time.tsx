"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { formatAbsoluteDate, formatRelativeTime } from "@/lib/utils";

interface RelativeTimeProps {
  readonly iso: string;
  readonly className?: string;
}

const subscribeToNothing = () => () => {};

export function RelativeTime({ iso, className }: RelativeTimeProps) {
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );

  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const absolute = formatAbsoluteDate(iso);

  return (
    <time dateTime={iso} title={absolute} className={className}>
      {hydrated ? formatRelativeTime(iso) : absolute}
    </time>
  );
}
