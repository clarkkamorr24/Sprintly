import { TaskPriority } from "@/lib/generated/prisma/enums";

export const PRIORITY_LABEL: Readonly<Record<TaskPriority, string>> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.URGENT]: "Urgent",
};

export const PRIORITY_STYLE: Readonly<Record<TaskPriority, string>> = {
  [TaskPriority.LOW]: "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
  [TaskPriority.MEDIUM]: "border-sky-300 text-sky-700 dark:border-sky-800 dark:text-sky-300",
  [TaskPriority.HIGH]: "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300",
  [TaskPriority.URGENT]: "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300",
};

export const PRIORITY_ORDER: readonly TaskPriority[] = [
  TaskPriority.URGENT,
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
];
