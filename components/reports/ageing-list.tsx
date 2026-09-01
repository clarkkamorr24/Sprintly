import { InitialsTile } from "@/components/shared/initials-tile";
import { PriorityTag } from "@/components/shared/priority-tag";
import type { AgeingIssueDTO } from "@/types/dto";

interface AgeingListProps {
  readonly issues: readonly AgeingIssueDTO[];
}

export function AgeingList({ issues }: AgeingListProps) {
  return (
    <section aria-labelledby="ageing-heading" className="sp-panel p-4 lg:p-5">
      <h2 id="ageing-heading" className="sp-kicker mb-1 text-[13px]">
        Oldest open issues
      </h2>
      <p className="mb-4 text-[12px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
        Open the longest without being completed.
      </p>

      {issues.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
          Nothing open - the backlog is clear.
        </p>
      ) : (
        <ul className="divide-y divide-(--sp-neutral-200)">
          {issues.map((issue) => (
            <li key={issue.id} className="flex min-w-0 items-center gap-2.5 py-2">
              <span className="sp-mono-key hidden shrink-0 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)] sm:inline">
                {issue.key}
              </span>

              <span className="min-w-0 flex-1 truncate text-[13px]">
                {issue.title}
              </span>

              <PriorityTag
                priority={issue.priority}
                className="hidden md:inline-flex"
              />

              {issue.assignee ? (
                <span className="hidden sm:block">
                  <InitialsTile user={issue.assignee} size="xs" />
                </span>
              ) : null}

              <span className="shrink-0 text-[12px] tabular-nums text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
                {issue.ageDays}d
                <span className="sr-only"> old</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
