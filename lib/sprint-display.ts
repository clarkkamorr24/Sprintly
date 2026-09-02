import { SprintStatus } from "@/lib/generated/prisma/enums";

const LOCALE = "en-US";

export const SPRINT_STATUS_LABEL: Readonly<Record<SprintStatus, string>> = {
  [SprintStatus.PLANNED]: "Planned",
  [SprintStatus.ACTIVE]: "Active",
  [SprintStatus.COMPLETED]: "Completed",
};

export const SPRINT_STATUS_STYLE: Readonly<Record<SprintStatus, string>> = {
  [SprintStatus.PLANNED]:
    "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
  [SprintStatus.ACTIVE]:
    "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
  [SprintStatus.COMPLETED]:
    "border-slate-300 text-muted-foreground dark:border-slate-700",
};

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const sameYear = start.getFullYear() === end.getFullYear();

  const startText = start.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endText = end.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} – ${endText}`;
}

export function daysRemaining(endIso: string): number {
  const end = new Date(endIso);
  end.setHours(23, 59, 59, 999);

  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function workDaysRemaining(endIso: string, from: Date = new Date()): number {
  const cursor = atMidnight(from);
  const end = atMidnight(new Date(endIso));

  let count = 0;

  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

interface SprintTiming {
  readonly status: SprintStatus;
  readonly startDate: string;
  readonly endDate: string;
}

export type SprintCategory = "past" | "active" | "future";

export const SPRINT_CATEGORY_LABEL: Readonly<Record<SprintCategory, string>> = {
  past: "Past",
  active: "Active",
  future: "Future",
};

export const SPRINT_CATEGORY_ORDER: readonly SprintCategory[] = [
  "active",
  "future",
  "past",
];

export function sprintCategory(
  sprint: SprintTiming,
  now: Date = new Date()
): SprintCategory {
  if (sprint.status === SprintStatus.COMPLETED) return "past";
  if (sprint.status === SprintStatus.ACTIVE) return "active";

  const today = atMidnight(now);

  if (atMidnight(new Date(sprint.endDate)) < today) return "past";
  if (atMidnight(new Date(sprint.startDate)) > today) return "future";

  return "active";
}

export function sprintDetail(sprint: SprintTiming): string {
  const parts = [formatDateRange(sprint.startDate, sprint.endDate)];

  if (sprint.status === SprintStatus.ACTIVE) {
    const days = workDaysRemaining(sprint.endDate);

    parts.push(
      days > 0
        ? `${days} work day${days === 1 ? "" : "s"} remaining`
        : "Past end date"
    );
  }

  return parts.join(" · ");
}

export function sprintSummary(sprint: SprintTiming): string {
  return `${SPRINT_STATUS_LABEL[sprint.status]} · ${sprintDetail(sprint)}`;
}
