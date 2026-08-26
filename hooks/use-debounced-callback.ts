"use client";

import { useEffect, useRef } from "react";

export function useDebouncedCallback<Args extends readonly unknown[]>(
  callback: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  return (...args: Args) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => latest.current(...args), delay);
  };
}
