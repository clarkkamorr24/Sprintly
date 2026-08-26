import "server-only";

import { db } from "@/lib/db";
import { userSelect } from "@/repositories/workspace-repository";

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  editedAt: true,
  authorId: true,
  author: { select: userSelect },
} as const;

export function findComments(taskId: string, take: number, skip: number) {
  return db.comment.findMany({
    where: { taskId },
    select: commentSelect,
    orderBy: { createdAt: "asc" },
    take,
    skip,
  });
}

export function countComments(taskId: string) {
  return db.comment.count({ where: { taskId } });
}

export function findCommentWithTask(commentId: string) {
  return db.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      taskId: true,
      task: { select: { id: true, title: true, projectId: true } },
    },
  });
}

export function createComment(input: {
  taskId: string;
  authorId: string;
  body: string;
}) {
  return db.comment.create({
    data: input,
    select: commentSelect,
  });
}

export function updateComment(commentId: string, body: string) {
  return db.comment.update({
    where: { id: commentId },
    data: { body, editedAt: new Date() },
    select: commentSelect,
  });
}

export function deleteComment(commentId: string) {
  return db.comment.delete({ where: { id: commentId } });
}
