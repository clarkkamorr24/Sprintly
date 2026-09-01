import "server-only";

import { requireProjectAccess } from "@/lib/auth/guards";
import { can, hasAtLeastRole, PERMISSIONS } from "@/lib/auth/permissions";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  ActivityType,
  NotificationType,
  WorkspaceRole,
} from "@/lib/generated/prisma/enums";
import * as activityRepo from "@/repositories/activity-repository";
import * as repo from "@/repositories/comment-repository";
import * as taskRepo from "@/repositories/task-repository";
import { extractMentionHandles } from "@/lib/mentions";
import * as workspaceRepo from "@/repositories/workspace-repository";
import * as notificationService from "@/services/notification-service";
import type {
  CreateCommentInput,
  DeleteCommentInput,
  ListCommentsInput,
  UpdateCommentInput,
} from "@/schemas/comment";
import type { Paginated } from "@/types/api";
import type { CommentDTO } from "@/types/dto";

type CommentRecord = Awaited<ReturnType<typeof repo.findComments>>[number];

function toCommentDTO(
  comment: CommentRecord,
  viewerId: string,
  viewerRole: WorkspaceRole
): CommentDTO {
  const isAuthor = comment.authorId === viewerId;

  return {
    id: comment.id,
    body: comment.body,
    author: comment.author,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
    canEdit: isAuthor,
    canDelete: isAuthor || hasAtLeastRole(viewerRole, WorkspaceRole.ADMIN),
  };
}

export async function listComments(
  input: ListCommentsInput
): Promise<Paginated<CommentDTO>> {
  const task = await taskRepo.findTaskOwnership(input.taskId);
  if (!task) throw new NotFoundError("Task not found.");

  const context = await requireProjectAccess(task.projectId);

  const [comments, total] = await Promise.all([
    repo.findComments(
      input.taskId,
      input.pageSize,
      (input.page - 1) * input.pageSize
    ),
    repo.countComments(input.taskId),
  ]);

  return {
    items: comments.map((c) => toCommentDTO(c, context.user.id, context.role)),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function createComment(
  input: CreateCommentInput
): Promise<CommentDTO> {
  const task = await taskRepo.findTaskOwnership(input.taskId);
  if (!task) throw new NotFoundError("Task not found.");

  const context = await requireProjectAccess(task.projectId);

  if (!can(context.role, PERMISSIONS.COMMENT_CREATE)) {
    throw new ForbiddenError("You do not have permission to comment.");
  }

  const comment = await repo.createComment({
    taskId: input.taskId,
    authorId: context.user.id,
    body: input.body,
  });

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: task.projectId,
    taskId: input.taskId,
    actorId: context.user.id,
    type: ActivityType.COMMENT_ADDED,
    metadata: {},
  });

  await notifyCommentRecipients({
    body: input.body,
    task,
    context,
    excerpt: input.body.slice(0, 140),
  });

  return toCommentDTO(comment, context.user.id, context.role);
}

type CommentContext = Awaited<ReturnType<typeof requireProjectAccess>>;
type CommentTask = NonNullable<
  Awaited<ReturnType<typeof taskRepo.findTaskOwnership>>
>;

async function notifyCommentRecipients(input: {
  body: string;
  task: CommentTask;
  context: CommentContext;
  excerpt: string;
  previousBody?: string;
  mentionsOnly?: boolean;
}): Promise<void> {
  const { task, context } = input;

  const alreadyMentioned = new Set(
    input.previousBody ? extractMentionHandles(input.previousBody) : []
  );

  const mentionedNames = extractMentionHandles(input.body).filter(
    (handle) => !alreadyMentioned.has(handle)
  );

  const mentioned = mentionedNames.length
    ? await workspaceRepo.findWorkspaceMembersByHandle(
        context.workspaceId,
        mentionedNames
      )
    : [];

  const mentionNotifications = mentioned.map((user) => ({
    recipientId: user.id,
    actorId: context.user.id,
    type: NotificationType.COMMENT_MENTION,
    title: `${context.user.name} mentioned you on "${task.title}"`,
    body: input.excerpt,
    workspaceId: context.workspaceId,
    projectId: task.projectId,
    taskId: task.id,
  }));

  const mentionedIds = new Set(mentioned.map((u) => u.id));

  const followers = [
    task.createdById,
    ...task.assignees.map((a) => a.userId),
  ].filter((id) => !mentionedIds.has(id));

  const followerNotifications = input.mentionsOnly
    ? []
    : followers.map((recipientId) => ({
        recipientId,
        actorId: context.user.id,
        type: NotificationType.COMMENT_ADDED,
        title: `${context.user.name} commented on "${task.title}"`,
        body: input.excerpt,
        workspaceId: context.workspaceId,
        projectId: task.projectId,
        taskId: task.id,
      }));

  await notificationService.notify(
    [...mentionNotifications, ...followerNotifications],
    context.user.id
  );
}

export async function updateComment(
  input: UpdateCommentInput
): Promise<CommentDTO> {
  const existing = await repo.findCommentWithTask(input.commentId);
  if (!existing) throw new NotFoundError("Comment not found.");

  const context = await requireProjectAccess(existing.task.projectId);

  if (existing.authorId !== context.user.id) {
    throw new ForbiddenError("You can only edit your own comments.");
  }

  const comment = await repo.updateComment(input.commentId, input.body);
  
  await notifyCommentRecipients({
    body: input.body,
    previousBody: existing.body,
    mentionsOnly: true,
    task: existing.task,
    context,
    excerpt: input.body.slice(0, 140),
  });

  return toCommentDTO(comment, context.user.id, context.role);
}

export async function deleteComment(input: DeleteCommentInput): Promise<void> {
  const existing = await repo.findCommentWithTask(input.commentId);
  if (!existing) throw new NotFoundError("Comment not found.");

  const context = await requireProjectAccess(existing.task.projectId);

  const isAuthor = existing.authorId === context.user.id;
  const isModerator = hasAtLeastRole(context.role, WorkspaceRole.ADMIN);

  if (!isAuthor && !isModerator) {
    throw new ForbiddenError("You can only delete your own comments.");
  }

  await repo.deleteComment(input.commentId);

  await activityRepo.recordActivity({
    workspaceId: context.workspaceId,
    projectId: existing.task.projectId,
    taskId: existing.taskId,
    actorId: context.user.id,
    type: ActivityType.COMMENT_DELETED,
    metadata: {},
  });
}
