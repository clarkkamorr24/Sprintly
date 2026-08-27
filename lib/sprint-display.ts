import { SprintStatus } from "@/lib/generated/prisma/enums";

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

  const startText = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endText = end.toLocaleDateString(undefined, {
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
