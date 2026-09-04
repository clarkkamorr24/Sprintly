export const BACKLOG_COLUMN_NAME = "Backlog";

export const DEFAULT_BOARD_COLUMNS = [
  { name: "To Do", isDone: false },
  { name: "In Progress", isDone: false },
  { name: "Review", isDone: false },
  { name: "Done", isDone: true },
] as const;

export const POSITION_STEP = 1000;

export const PAGE_SIZE = {
  DEFAULT: 20,
  COMMENTS: 20,
  ACTIVITY: 10,
  NOTIFICATIONS: 20,
  MAX: 100,
} as const;

export const PROJECT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#ef4444",
] as const;

export const LABEL_COLORS = [
  "#64748b",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#ec4899",
] as const;

export const PATHNAME_HEADER = "x-sprintly-pathname";
