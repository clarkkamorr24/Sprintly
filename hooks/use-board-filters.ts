"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import type { BoardFilters } from "@/schemas/task";

export const FILTER_KEYS = [
  "search",
  "assigneeId",
  "priority",
  "labelId",
  "due",
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

export function useBoardFilters(pathname: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo<BoardFilters>(() => {
    const read = (key: FilterKey) => searchParams.get(key) ?? undefined;

    return {
      search: read("search"),
      assigneeId: read("assigneeId"),
      priority: read("priority") as BoardFilters["priority"],
      labelId: read("labelId"),
      due: read("due") as BoardFilters["due"],
    };
  }, [searchParams]);

  const activeCount = FILTER_KEYS.filter((key) => searchParams.get(key)).length;

  const setFilter = useCallback(
    (key: FilterKey, value: string | undefined) => {
      const next = new URLSearchParams(searchParams);

      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, activeCount, setFilter, clearFilters };
}
