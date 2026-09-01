import { Badge } from "@/components/ui/badge";
import { SPRINT_STATUS_LABEL, formatDateRange } from "@/lib/sprint-display";
import { cn } from "@/lib/utils";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import type { SprintOutcomeDTO } from "@/types/dto";

interface SprintOutcomesProps {
  readonly sprints: readonly SprintOutcomeDTO[];
}

export function SprintOutcomes({ sprints }: SprintOutcomesProps) {
  return (
    <section aria-labelledby="sprints-heading" className="sp-panel p-4 lg:p-5">
      <h2 id="sprints-heading" className="sp-kicker mb-4 text-[13px]">
        Sprint completion
      </h2>

      {sprints.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
          No sprints yet. Create one from the Sprints page to track completion.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {sprints.map((sprint) => {
            const percent =
              sprint.total === 0
                ? 0
                : Math.round((sprint.completed / sprint.total) * 100);

            return (
              <li key={sprint.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="sp-mono-key shrink-0 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
                    {sprint.projectKey}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {sprint.name}
                  </span>

                  <Badge
                    className={cn(
                      "shrink-0 px-2 py-px text-[10px]",
                      sprint.status === SprintStatus.ACTIVE
                        ? "bg-(--sp-accent) text-(--sp-bg)"
                        : "bg-(--sp-neutral-200) text-(--sp-neutral-800)"
                    )}
                  >
                    {SPRINT_STATUS_LABEL[sprint.status]}
                  </Badge>

                  <span className="shrink-0 text-[12px] tabular-nums">
                    {sprint.completed}/{sprint.total}
                    <span className="sr-only">
                      {" "}
                      issues completed ({percent}%)
                    </span>
                  </span>
                </div>

                <div aria-hidden className="h-1.5 w-full bg-(--sp-neutral-200)">
                  <div
                    className="h-full bg-(--sp-accent)"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-[11px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
                  {formatDateRange(sprint.startDate, sprint.endDate)}
                  {sprint.points > 0 ? (
                    <> · {sprint.completedPoints}/{sprint.points} points</>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
