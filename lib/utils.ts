import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;

  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return due.getTime() < today.getTime()
}

export function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)

  const days = Math.round(
    (dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days === -1) return "Yesterday"

  return due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: due.getFullYear() === today.getFullYear() ? undefined : "numeric",
  })
}
