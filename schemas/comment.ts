import * as z from "zod";

import { paginationSchema, uuidSchema } from "@/schemas/common";

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, { error: "Write something before posting." })
  .max(5000, { error: "Comment must be 5000 characters or fewer." });

export const createCommentSchema = z.object({
  taskId: uuidSchema,
  body: commentBodySchema,
});

export const updateCommentSchema = z.object({
  commentId: uuidSchema,
  body: commentBodySchema,
});

export const deleteCommentSchema = z.object({
  commentId: uuidSchema,
});

export const listCommentsSchema = paginationSchema.extend({
  taskId: uuidSchema,
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
export type ListCommentsInput = z.infer<typeof listCommentsSchema>;
