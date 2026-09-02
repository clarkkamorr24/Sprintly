"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBoardFilters } from "@/hooks/use-board-filters";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import { SPRINT_STATUS_LABEL, sprintDetail } from "@/lib/sprint-display";
import type { SprintDTO } from "@/types/dto";

const STATUS_ORDER: Readonly<Record<SprintStatus, number>> = {
  [SprintStatus.ACTIVE]: 0,
  [SprintStatus.PLANNED]: 1,
  [SprintStatus.COMPLETED]: 2,
};

interface SprintSelectorProps {
  readonly sprints: readonly SprintDTO[];
  readonly selectedSprintNumber: number | null;
}

export function SprintSelector({
  sprints,
  selectedSprintNumber,
}: SprintSelectorProps) {
  const { setFilter } = useBoardFilters();

  if (sprints.length === 0) return null;

  const ordered = [...sprints].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.startDate.localeCompare(b.startDate)
  );

  const selected = ordered.find(
    (sprint) => sprint.number === selectedSprintNumber
  );

  const items = ordered.map((sprint) => ({
    value: String(sprint.number),
    label: `${sprint.name} · ${SPRINT_STATUS_LABEL[sprint.status]}`,
  }));

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Select
        items={items}
        value={String(selected?.number ?? ordered[0].number)}
        onValueChange={(value) => setFilter("sprint", String(value))}
      >
        <SelectTrigger size="sm" aria-label="Sprint" className="min-w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected ? (
        <span className="text-[12px] text-muted-foreground">
          {sprintDetail(selected)}
        </span>
      ) : (
        <span className="text-[12px] text-muted-foreground">
          Select a sprint to see its work.
        </span>
      )}
    </div>
  );
}
