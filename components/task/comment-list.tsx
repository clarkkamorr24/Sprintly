"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import {
  createCommentAction,
  deleteCommentAction,
  updateCommentAction,
} from "@/app/actions/comment-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { CommentBody } from "@/components/task/comment-body";
import { MentionTextarea } from "@/components/task/mention-textarea";
import type { CommentDTO, UserDTO } from "@/types/dto";
import { RelativeTime } from "@/components/shared/relative-time";

interface CommentListProps {
  readonly taskId: string;
  readonly comments: readonly CommentDTO[];
  readonly members: readonly UserDTO[];
  readonly currentUserId: string;
  readonly canComment: boolean;
  readonly onChange: () => void;
}

export function CommentList({
  taskId,
  comments,
  members,
  currentUserId,
  canComment,
  onChange,
}: CommentListProps) {
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = body.trim();
    if (!value) return;

    startTransition(async () => {
      const result = await createCommentAction({ taskId, body: value });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setBody("");
      onChange();
    });
  };

  const handleUpdate = (commentId: string) => {
    const value = editBody.trim();
    if (!value) return;

    startTransition(async () => {
      const result = await updateCommentAction({ commentId, body: value });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setEditingId(null);
      onChange();
    });
  };

  const confirmDelete = () => {
    const commentId = pendingDelete;
    if (!commentId) return;

    startTransition(async () => {
      const result = await deleteCommentAction({ commentId });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setPendingDelete(null);
      onChange();
    });
  };

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <UserAvatar user={comment.author} size="sm" className="mt-0.5" />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium">
                    {comment.author.name}
                  </span>
                  <time
                    dateTime={comment.createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    <RelativeTime iso={comment.createdAt} />
                  </time>
                  {comment.editedAt ? (
                    <span className="text-xs text-muted-foreground">
                      (edited)
                    </span>
                  ) : null}
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <MentionTextarea
                      value={editBody}
                      onChange={setEditBody}
                      members={members}
                      currentUserId={currentUserId}
                      rows={3}
                      aria-label="Edit comment"
                      disabled={isPending}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isPending || !editBody.trim()}
                        onClick={() => handleUpdate(comment.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CommentBody body={comment.body} members={members} />

                    {comment.canEdit || comment.canDelete ? (
                      <div className="flex gap-3">
                        {comment.canEdit ? (
                          <button
                            type="button"
                            className="rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditBody(comment.body);
                            }}
                          >
                            Edit
                          </button>
                        ) : null}
                        {comment.canDelete ? (
                          <button
                            type="button"
                            className="rounded-sm text-xs text-muted-foreground outline-none hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            disabled={isPending}
                            onClick={() => setPendingDelete(comment.id)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form onSubmit={handleCreate} className="space-y-2">
          <MentionTextarea
            value={body}
            onChange={setBody}
            members={members}
            currentUserId={currentUserId}
            rows={3}
            placeholder="Write a comment… use @ to mention someone"
            aria-label="New comment"
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
              {isPending ? "Posting…" : "Comment"}
            </Button>
          </div>
        </form>
      ) : null}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this comment?"
        description="This comment will be permanently deleted. This cannot be undone."
        isPending={isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      />
    </section>
  );
}
