"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InitialsTile } from "@/components/shared/initials-tile";
import { PriorityTag } from "@/components/shared/priority-tag";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ISSUE_TYPE_COLOR,
  ISSUE_TYPE_LABEL,
  ISSUE_TYPE_LETTER,
} from "@/lib/issue-display";
import { cn } from "@/lib/utils";
import type { WorkspaceIssueDTO } from "@/types/dto";

interface IssueListProps {
  readonly issues: readonly WorkspaceIssueDTO[];
  readonly canComment: boolean;
}

export function IssueList({ issues, canComment }: IssueListProps) {
  const router = useRouter();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  if (issues.length === 0) {
    return (
      <p className="sp-panel p-6 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
        No issues match these filters.
      </p>
    );
  }

  return (
    <>
      <ul className="sp-panel divide-y divide-(--sp-neutral-300)">
        {issues.map((issue) => (
          <li
            key={issue.id}
            className="sp-row-hover flex min-w-0 items-center gap-2.5 px-3 py-2.5"
          >
            <span
              aria-label={ISSUE_TYPE_LABEL[issue.type]}
              className="flex size-[15px] shrink-0 items-center justify-center border text-[9px] font-extrabold"
              style={{
                borderColor: ISSUE_TYPE_COLOR[issue.type],
                color: ISSUE_TYPE_COLOR[issue.type],
              }}
            >
              {ISSUE_TYPE_LETTER[issue.type]}
            </span>

            <span className="sp-mono-key hidden shrink-0 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)] sm:inline">
              {issue.key}
            </span>

            <button
              type="button"
              onClick={() => setOpenTaskId(issue.id)}
              className={cn(
                "min-w-0 flex-1 truncate text-left text-[13.5px] outline-none",
                "hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50",
                issue.isDone &&
                  "text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)] line-through"
              )}
            >
              {issue.title}
            </button>

            <Badge className="hidden shrink-0 bg-(--sp-neutral-200) px-2 py-px text-[10px] text-(--sp-neutral-800) lg:inline-flex">
              {issue.projectKey}
            </Badge>

            <span className="hidden w-[92px] shrink-0 truncate text-[11px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)] md:inline">
              {issue.columnName}
            </span>

            <PriorityTag
              priority={issue.priority}
              className="hidden md:inline-flex"
            />

            {issue.assignees[0] ? (
              <span className="hidden sm:block">
                <InitialsTile user={issue.assignees[0]} size="xs" />
              </span>
            ) : (
              <span className="hidden size-[22px] shrink-0 sm:block" />
            )}

            {issue.storyPoints !== null ? (
              <span className="w-4 shrink-0 text-right text-[12px] font-extrabold">
                {issue.storyPoints}
              </span>
            ) : (
              <span className="w-4 shrink-0" />
            )}
          </li>
        ))}
      </ul>

      <TaskDetailDialog
        taskId={openTaskId}
        canComment={canComment}
        onOpenChange={(open) => {
          if (!open) setOpenTaskId(null);
        }}
        onMutated={() => router.refresh()}
      />
    </>
  );
}
