"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { getTaskDetailAction } from "@/app/actions/task-actions";
import { ActivityTimeline } from "@/components/task/activity-timeline";
import { AssigneePicker } from "@/components/task/assignee-picker";
import { TaskFieldsEditor } from "@/components/task/task-fields-editor";
import { Button } from "@/components/ui/button";
import { CommentList } from "@/components/task/comment-list";
import { SubtaskList } from "@/components/task/subtask-list";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/task-display";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";
import type { TaskDetailBundle } from "@/types/dto";

interface TaskDetailDialogProps {
  readonly taskId: string | null;
  readonly canComment: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onMutated: () => void;
}

export function TaskDetailDialog({
  taskId,
  canComment,
  onOpenChange,
  onMutated,
}: TaskDetailDialogProps) {
  return (
    <Dialog open={taskId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[min(56rem,92vw)]">
        {taskId ? (
          <TaskDetailContent
            key={taskId}
            taskId={taskId}
            canComment={canComment}
            onMutated={onMutated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface TaskDetailContentProps {
  readonly taskId: string;
  readonly canComment: boolean;
  readonly onMutated: () => void;
}

function TaskDetailContent({
  taskId,
  canComment,
  onMutated,
}: TaskDetailContentProps) {
  const [bundle, setBundle] = useState<TaskDetailBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const load = useCallback((id: string) => {
    startTransition(async () => {
      const result = await getTaskDetailAction(id);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setError(null);
      setBundle(result.data);
    });
  }, []);

  useEffect(() => {
    load(taskId);
  }, [taskId, load]);

  const refresh = () => {
    load(taskId);
    onMutated();
  };

  const task = bundle?.task;

  return (
    <>
      {error ? (
        <DialogHeader>
          <DialogTitle>Task unavailable</DialogTitle>
          <DialogDescription>{error}</DialogDescription>
        </DialogHeader>
      ) : !task ? (
        <div className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <span className="sr-only" role="status">
            Loading task…
          </span>
        </div>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle className="pr-6 text-left">{task.title}</DialogTitle>
            <DialogDescription className="text-left">
              In {task.column.name} · created by {task.createdBy.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">Priority</dt>
                <dd>
                  <Badge
                    variant="outline"
                    className={PRIORITY_STYLE[task.priority]}
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </Badge>
                </dd>
              </div>

              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">Due</dt>
                <dd
                  className={cn(
                    isOverdue(task.dueDate) && "font-medium text-destructive",
                  )}
                >
                  {task.dueDate ? formatDueDate(task.dueDate) : "No due date"}
                </dd>
              </div>

              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">Assignee</dt>
                <dd>
                  <AssigneePicker
                    task={task}
                    members={bundle.members}
                    canEdit={bundle.canEdit}
                    onChange={refresh}
                  />
                </dd>
              </div>
            </dl>

            {task.labels.length > 0 ? (
              <ul className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <li key={label.id}>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${label.color}1a`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Description</h3>
                {bundle.canEdit && !isEditing ? (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Edit details
                  </Button>
                ) : null}
              </div>

              {isEditing ? (
                <TaskFieldsEditor
                  task={task}
                  onDone={() => {
                    setEditing(false);
                    refresh();
                  }}
                  onCancel={() => setEditing(false)}
                />
              ) : task.description ? (
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No description.</p>
              )}
            </section>

            <Separator />

            <SubtaskList
              taskId={task.id}
              subtasks={bundle.subtasks}
              canEdit={bundle.canEdit}
              onChange={refresh}
            />

            <Separator />

            <CommentList
              taskId={task.id}
              comments={bundle.comments.items}
              members={bundle.members}
              currentUserId={bundle.currentUserId}
              canComment={canComment}
              onChange={refresh}
            />

            <Separator />

            <ActivityTimeline
              entries={bundle.activity.items}
              total={bundle.activity.total}
            />
          </div>
        </>
      )}
    </>
  );
}
