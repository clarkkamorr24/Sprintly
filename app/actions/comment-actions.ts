"use server";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as commentService from "@/services/comment-service";
import {
  createCommentSchema,
  deleteCommentSchema,
  listCommentsSchema,
  updateCommentSchema,
} from "@/schemas/comment";
import type { ApiResponse, Paginated } from "@/types/api";
import type { CommentDTO } from "@/types/dto";

export async function listCommentsAction(
  input: unknown
): Promise<ApiResponse<Paginated<CommentDTO>>> {
  return handleAction("listCommentsAction", async () => {
    const data = parseInput(listCommentsSchema, input);
    return commentService.listComments(data);
  });
}

export async function createCommentAction(
  input: unknown
): Promise<ApiResponse<CommentDTO>> {
  return handleAction("createCommentAction", async () => {
    const data = parseInput(createCommentSchema, input);
    return commentService.createComment(data);
  });
}

export async function updateCommentAction(
  input: unknown
): Promise<ApiResponse<CommentDTO>> {
  return handleAction("updateCommentAction", async () => {
    const data = parseInput(updateCommentSchema, input);
    return commentService.updateComment(data);
  });
}

export async function deleteCommentAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteCommentAction", async () => {
    const data = parseInput(deleteCommentSchema, input);
    await commentService.deleteComment(data);
    return null;
  });
}
