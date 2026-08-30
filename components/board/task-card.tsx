"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  CheckmarkSquare02Icon,
  Comment01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";

import { InitialsTile } from "@/components/shared/initials-tile";
import { PriorityTag } from "@/components/shared/priority-tag";
import {
  ISSUE_TYPE_COLOR,
  ISSUE_TYPE_LABEL,
  ISSUE_TYPE_LETTER,
} from "@/lib/issue-display";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";
import type { TaskCardDTO } from "@/types/dto";

interface TaskCardProps {
  readonly task: TaskCardDTO;
  readonly onOpen: (taskId: string) => void;
  readonly dragProps?: Record<string, unknown>;
  readonly keyboardDragProps?: Record<string, unknown>;
  readonly isDragging?: boolean;
  readonly menu?: React.ReactNode;
}

export function TaskCard({
  task,
  onOpen,
  dragProps,
  keyboardDragProps,
  isDragging,
  menu,
}: TaskCardProps) {
  const overdue = isOverdue(task.dueDate);

  return (
    <article
      {...dragProps}
      className={cn(
        "sp-card-hover group/task relative touch-none border border-(--sp-neutral-300) bg-(--sp-neutral-100) p-2.5 shadow-xs transition-colors",
        dragProps && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="mb-[7px] flex items-center gap-1.5">
        <span
          aria-label={ISSUE_TYPE_LABEL[task.type]}
          className="flex size-[15px] items-center justify-center border text-[9px] font-extrabold"
          style={{
            borderColor: ISSUE_TYPE_COLOR[task.type],
            color: ISSUE_TYPE_COLOR[task.type],
          }}
        >
          {ISSUE_TYPE_LETTER[task.type]}
        </span>
        <span className="sp-mono-key text-[11px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
          {task.key}
        </span>

        <div className="relative z-10 ml-auto flex items-center gap-0.5">
          {menu}
          <button
            type="button"
            aria-label={`Drag ${task.title}`}
            {...keyboardDragProps}
            className="cursor-grab touch-none p-0.5 text-[color-mix(in_srgb,var(--sp-text)_35%,transparent)] outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2.5} className="size-3" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="mb-2 block w-full text-left text-[13.5px] font-medium leading-[1.35] text-pretty outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {task.title}
      </button>

      {task.labels.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <li key={label.id}>
              <span className="inline-flex border border-(--sp-neutral-300) bg-(--sp-neutral-100) px-2 py-[3px] text-[11px] text-(--sp-neutral-800)">
                {label.name}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2 border-t border-(--sp-neutral-200) pt-[7px]">
        <PriorityTag priority={task.priority} />

        {task.storyPoints !== null ? (
          <span className="text-[11px] font-extrabold">{task.storyPoints}</span>
        ) : null}

        {task.dueDate ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              overdue
                ? "text-(--sp-accent-700)"
                : "text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]"
            )}
          >
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3" />
            {formatDueDate(task.dueDate)}
            {overdue ? <span className="sr-only">(overdue)</span> : null}
          </span>
        ) : null}

        {task.subtasks.total > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
            <HugeiconsIcon
              icon={CheckmarkSquare02Icon}
              strokeWidth={2}
              className="size-3"
            />
            {task.subtasks.completed}/{task.subtasks.total}
          </span>
        ) : null}

        {task.commentCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
            <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} className="size-3" />
            {task.commentCount}
            <span className="sr-only">comments</span>
          </span>
        ) : null}

        {task.assignees.length > 0 ? (
          <span className="ml-auto flex gap-0.5">
            {task.assignees.slice(0, 3).map((user) => (
              <InitialsTile key={user.id} user={user} size="xs" />
            ))}
          </span>
        ) : null}
      </div>
    </article>
  );
}
