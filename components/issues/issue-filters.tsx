"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { ISSUE_TYPE_LABEL, ISSUE_TYPE_ORDER } from "@/lib/issue-display";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/task-display";
import type { ProjectDTO } from "@/types/dto";

const ANY = "any";

const FILTER_KEYS = [
  "search",
  "projectId",
  "type",
  "priority",
  "status",
] as const;

interface IssueFiltersProps {
  readonly projects: readonly ProjectDTO[];
  readonly resultCount: number;
}

export function IssueFilters({ projects, resultCount }: IssueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchDraft, setSearchDraft] = useState(
    searchParams.get("search") ?? ""
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams);

      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }

      next.delete("page");

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  const pushSearch = useDebouncedCallback((value: string) => {
    setFilter("search", value.trim() || undefined);
  }, 300);

  const activeCount = FILTER_KEYS.filter((key) =>
    searchParams.get(key)
  ).length;

  const projectItems = [
    { value: ANY, label: "All projects" },
    ...projects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];

  const typeItems = [
    { value: ANY, label: "Any type" },
    ...ISSUE_TYPE_ORDER.map((t) => ({ value: t, label: ISSUE_TYPE_LABEL[t] })),
  ];

  const priorityItems = [
    { value: ANY, label: "Any priority" },
    ...PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_LABEL[p] })),
  ];

  const statusItems = [
    { value: ANY, label: "Any status" },
    { value: "open", label: "Open" },
    { value: "done", label: "Done" },
  ];

  const read = (key: string) => searchParams.get(key) ?? ANY;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-[260px]">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2 opacity-55"
        />
        <Input
          type="search"
          value={searchDraft}
          onChange={(event) => {
            setSearchDraft(event.target.value);
            pushSearch(event.target.value);
          }}
          placeholder="Search issues"
          aria-label="Search issues"
          className="h-9 pl-8"
        />
      </div>

      <Select
        items={projectItems}
        value={read("projectId")}
        onValueChange={(value) =>
          setFilter("projectId", String(value) === ANY ? undefined : String(value))
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by project">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {projectItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={typeItems}
        value={read("type")}
        onValueChange={(value) =>
          setFilter("type", String(value) === ANY ? undefined : String(value))
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by issue type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {typeItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={priorityItems}
        value={read("priority")}
        onValueChange={(value) =>
          setFilter("priority", String(value) === ANY ? undefined : String(value))
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {priorityItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={statusItems}
        value={read("status")}
        onValueChange={(value) =>
          setFilter("status", String(value) === ANY ? undefined : String(value))
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchDraft("");
            router.replace(pathname, { scroll: false });
          }}
        >
          Clear
        </Button>
      ) : null}

      <span
        aria-live="polite"
        className="ml-auto text-[12px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]"
      >
        {resultCount} {resultCount === 1 ? "issue" : "issues"}
      </span>
    </div>
  );
}
