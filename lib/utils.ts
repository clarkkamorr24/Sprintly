import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const LOCALE = "en-US"

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

  return due.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: due.getFullYear() === today.getFullYear() ? undefined : "numeric",
  })
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const seconds = Math.round((then - Date.now()) / 1000)
  const abs = Math.abs(seconds)

  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" })

  if (abs < 60) return formatter.format(Math.round(seconds), "second")
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return formatter.format(Math.round(seconds / 3600), "hour")
  if (abs < 2592000) return formatter.format(Math.round(seconds / 86400), "day")

  return formatAbsoluteDate(iso)
}

export function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
