import * as z from "zod";

import { uuidSchema } from "@/schemas/common";

export const subtaskTitleSchema = z
  .string()
  .trim()
  .min(1, { error: "Subtask title is required." })
  .max(200, { error: "Title must be 200 characters or fewer." });

export const createSubtaskSchema = z.object({
  taskId: uuidSchema,
  title: subtaskTitleSchema,
});

export const updateSubtaskSchema = z.object({
  subtaskId: uuidSchema,
  title: subtaskTitleSchema,
});

export const toggleSubtaskSchema = z.object({
  subtaskId: uuidSchema,
  isCompleted: z.boolean(),
});

export const deleteSubtaskSchema = z.object({
  subtaskId: uuidSchema,
});

export const reorderSubtasksSchema = z.object({
  taskId: uuidSchema,
  subtaskIds: z.array(uuidSchema).min(1),
});

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type ToggleSubtaskInput = z.infer<typeof toggleSubtaskSchema>;
export type DeleteSubtaskInput = z.infer<typeof deleteSubtaskSchema>;
export type ReorderSubtasksInput = z.infer<typeof reorderSubtasksSchema>;
