"use client";

import { useState } from "react";
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
import { useBoardFilters } from "@/hooks/use-board-filters";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/task-display";
import type { LabelDTO, UserDTO } from "@/types/dto";

const ANY = "any";

interface BoardFiltersProps {
  readonly projectId: string;
  readonly members: readonly UserDTO[];
  readonly labels: readonly LabelDTO[];
  readonly resultCount: number;
}

export function BoardFilters({
  projectId,
  members,
  labels,
  resultCount,
}: BoardFiltersProps) {
  const { filters, activeCount, setFilter, clearFilters } = useBoardFilters(
    `/projects/${projectId}`
  );

  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");

  const pushSearch = useDebouncedCallback((value: string) => {
    setFilter("search", value.trim() || undefined);
  }, 300);

  const assigneeItems = [
    { value: ANY, label: "Anyone" },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  const priorityItems = [
    { value: ANY, label: "Any priority" },
    ...PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_LABEL[p] })),
  ];

  const labelItems = [
    { value: ANY, label: "Any label" },
    ...labels.map((l) => ({ value: l.id, label: l.name })),
  ];

  const dueItems = [
    { value: ANY, label: "Any due date" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Due today" },
    { value: "week", label: "Due this week" },
  ];

  const toValue = (value: unknown) =>
    String(value) === ANY ? undefined : String(value);

  return (
    <section aria-label="Filter tasks" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={searchDraft}
            placeholder="Search tasks…"
            aria-label="Search tasks by title"
            className="pl-9"
            onChange={(event) => {
              setSearchDraft(event.target.value);
              pushSearch(event.target.value);
            }}
          />
        </div>

        <Select
          items={assigneeItems}
          value={filters.assigneeId ?? ANY}
          onValueChange={(value) => setFilter("assigneeId", toValue(value))}
        >
          <SelectTrigger size="sm" aria-label="Filter by assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assigneeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={priorityItems}
          value={filters.priority ?? ANY}
          onValueChange={(value) => setFilter("priority", toValue(value))}
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

        {labels.length > 0 ? (
          <Select
            items={labelItems}
            value={filters.labelId ?? ANY}
            onValueChange={(value) => setFilter("labelId", toValue(value))}
          >
            <SelectTrigger size="sm" aria-label="Filter by label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {labelItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select
          items={dueItems}
          value={filters.due ?? ANY}
          onValueChange={(value) => setFilter("due", toValue(value))}
        >
          <SelectTrigger size="sm" aria-label="Filter by due date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dueItems.map((item) => (
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
              clearFilters();
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {activeCount > 0 ? (
        <p className="text-xs text-muted-foreground" role="status">
          {resultCount === 0
            ? "No tasks match these filters."
            : `${resultCount} matching ${resultCount === 1 ? "task" : "tasks"}.`}
        </p>
      ) : null}
    </section>
  );
}
