"use client";

import { InitialsTile } from "@/components/shared/initials-tile";
import { PriorityTag } from "@/components/shared/priority-tag";
import {
  ISSUE_TYPE_COLOR,
  ISSUE_TYPE_LABEL,
  ISSUE_TYPE_LETTER,
} from "@/lib/issue-display";
import type { TaskCardDTO } from "@/types/dto";

interface IssueRowProps {
  readonly task: TaskCardDTO;
  readonly columnName?: string;
  readonly onOpen: (taskId: string) => void;
  readonly action?: React.ReactNode;
}

export function IssueRow({ task, columnName, onOpen, action }: IssueRowProps) {
  return (
    <tr className="sp-row-hover border-b border-(--sp-neutral-300) last:border-b-0">
      <td className="w-[26px] py-2 pl-3">
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
      </td>

      <td className="sp-mono-key w-[82px] py-2 text-[12px]">{task.key}</td>

      <td className="py-2">
        <button
          type="button"
          onClick={() => onOpen(task.id)}
          className="text-left text-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {task.title}
        </button>
      </td>

      <td className="hidden w-[110px] py-2 text-[12px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)] md:table-cell">
        {columnName}
      </td>

      <td className="w-[86px] py-2">
        <PriorityTag priority={task.priority} />
      </td>

      <td className="w-[52px] py-2 text-[12px] font-extrabold">
        {task.storyPoints ?? ""}
      </td>

      <td className="w-[34px] py-2">
        {task.assignees[0] ? (
          <InitialsTile user={task.assignees[0]} size="xs" />
        ) : null}
      </td>

      {action ? <td className="w-[130px] py-2 pr-3 text-right">{action}</td> : null}
    </tr>
  );
}
