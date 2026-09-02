import * as z from "zod";

import { IssueType, TaskPriority } from "@/lib/generated/prisma/enums";
import { uuidSchema } from "@/schemas/common";

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, { error: "Title is required." })
  .max(200, { error: "Title must be 200 characters or fewer." });

export const taskPrioritySchema = z.enum(TaskPriority, {
  error: "Choose a valid priority.",
});

export const issueTypeSchema = z.enum(IssueType, {
  error: "Choose a valid issue type.",
});

const storyPointsSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(100)
  .nullable()
  .optional();

const dueDateSchema = z
  .union([z.iso.datetime({ offset: true }), z.iso.date(), z.literal(""), z.null()])
  .optional();

export const createTaskSchema = z.object({
  projectId: uuidSchema,
  columnId: uuidSchema.optional(),
  title: taskTitleSchema,
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  type: issueTypeSchema.default(IssueType.TASK),
  priority: taskPrioritySchema.default(TaskPriority.MEDIUM),
  storyPoints: storyPointsSchema,
  assigneeIds: z.array(uuidSchema).max(10).default([]),
  labelIds: z.array(uuidSchema).max(20).default([]),
  dueDate: dueDateSchema,
});

export const updateTaskSchema = z.object({
  taskId: uuidSchema,
  title: taskTitleSchema,
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  type: issueTypeSchema,
  priority: taskPrioritySchema,
  storyPoints: storyPointsSchema,
  assigneeIds: z.array(uuidSchema).max(10),
  labelIds: z.array(uuidSchema).max(20),
  dueDate: dueDateSchema,
});

export const deleteTaskSchema = z.object({
  taskId: uuidSchema,
});

export const boardFiltersSchema = z.object({
  assigneeId: uuidSchema.optional(),
  priority: taskPrioritySchema.optional(),
  labelId: uuidSchema.optional(),
  search: z.string().trim().max(120).optional(),
  due: z.enum(["overdue", "today", "week"]).optional(),
  /**
   * Per-project sprint number from the URL (?sprint=1). The id is resolved
   * server-side within the project, so a UUID is never exposed or accepted.
   * A malformed value is ignored rather than failing the page.
   */
  sprint: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .catch(undefined),
});

export const workspaceIssueFiltersSchema = boardFiltersSchema.extend({
  projectId: uuidSchema.optional(),
  status: z.enum(["open", "done"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type BoardFilters = z.infer<typeof boardFiltersSchema>;
export type WorkspaceIssueFilters = z.infer<typeof workspaceIssueFiltersSchema>;
