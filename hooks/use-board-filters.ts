"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import type { BoardFilters } from "@/schemas/task";

export const FILTER_KEYS = [
  "search",
  "assigneeId",
  "priority",
  "labelId",
  "due",
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number] | "sprint";

export function useBoardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<BoardFilters>(() => {
    const read = (key: FilterKey) => searchParams.get(key) ?? undefined;

    return {
      search: read("search"),
      assigneeId: read("assigneeId"),
      priority: read("priority") as BoardFilters["priority"],
      labelId: read("labelId"),
      due: read("due") as BoardFilters["due"],
      sprint: read("sprint") ? Number(read("sprint")) : undefined,
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
    const next = new URLSearchParams(searchParams);
    for (const key of FILTER_KEYS) next.delete(key);

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  return { filters, activeCount, setFilter, clearFilters };
}
