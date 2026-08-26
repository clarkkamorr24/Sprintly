"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  CheckmarkSquare02Icon,
  Comment01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/task-display";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";
import type { TaskCardDTO } from "@/types/dto";

interface TaskCardProps {
  readonly task: TaskCardDTO;
  readonly onOpen: (taskId: string) => void;
  readonly dragHandleProps?: Record<string, unknown>;
  readonly isDragging?: boolean;
  readonly menu?: React.ReactNode;
}

export function TaskCard({
  task,
  onOpen,
  dragHandleProps,
  isDragging,
  menu,
}: TaskCardProps) {
  const overdue = isOverdue(task.dueDate);

  return (
    <article
      className={cn(
        "group/task relative rounded-xl border border-border bg-card p-3 shadow-xs transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`Drag ${task.title}`}
          className="mt-0.5 cursor-grab touch-none rounded-sm p-0.5 text-muted-foreground/60 transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => onOpen(task.id)}
          className="flex-1 rounded-sm text-left text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {task.title}
        </button>

        {menu ? <div className="relative z-10 shrink-0">{menu}</div> : null}
      </div>

      {task.labels.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1">
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn("gap-1", PRIORITY_STYLE[task.priority])}>
          {PRIORITY_LABEL[task.priority]}
        </Badge>

        {task.dueDate ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              overdue ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3.5" />
            {formatDueDate(task.dueDate)}
            {overdue ? <span className="sr-only">(overdue)</span> : null}
          </span>
        ) : null}

        {task.subtasks.total > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={CheckmarkSquare02Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            {task.subtasks.completed}/{task.subtasks.total}
          </span>
        ) : null}

        {task.commentCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} className="size-3.5" />
            {task.commentCount}
            <span className="sr-only">comments</span>
          </span>
        ) : null}

        {task.assignees.length > 0 ? (
          <div className="ml-auto flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((user) => (
              <UserAvatar key={user.id} user={user} size="sm" />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
