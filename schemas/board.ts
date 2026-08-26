import * as z from "zod";

import { uuidSchema } from "@/schemas/common";

export const columnNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Column name is required." })
  .max(40, { error: "Column name must be 40 characters or fewer." });

export const createColumnSchema = z.object({
  projectId: uuidSchema,
  name: columnNameSchema,
});

export const renameColumnSchema = z.object({
  columnId: uuidSchema,
  name: columnNameSchema,
});

export const deleteColumnSchema = z.object({
  columnId: uuidSchema,
});

export const reorderColumnsSchema = z.object({
  projectId: uuidSchema,
  columnIds: z
    .array(uuidSchema)
    .min(1, { error: "At least one column is required." }),
});

export const moveTaskSchema = z.object({
  taskId: uuidSchema,
  toColumnId: uuidSchema,
  toIndex: z.number().int().min(0),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type RenameColumnInput = z.infer<typeof renameColumnSchema>;
export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
