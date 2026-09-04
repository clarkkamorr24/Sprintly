import { Badge } from "@/components/ui/badge";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import {
  daysRemaining,
  formatDateRange,
  SPRINT_STATUS_LABEL,
} from "@/lib/sprint-display";
import { cn } from "@/lib/utils";
import type { SprintDTO } from "@/types/dto";

interface SprintBannerProps {
  readonly sprint: SprintDTO;
  readonly totalPoints: number;
  readonly completedPoints: number;
}

export function SprintBanner({
  sprint,
  totalPoints,
  completedPoints,
}: SprintBannerProps) {
  const remaining = daysRemaining(sprint.endDate);
  const percent = totalPoints
    ? Math.round((completedPoints / totalPoints) * 100)
    : 0;

  const isActive = sprint.status === SprintStatus.ACTIVE;

  return (
    <div className="flex flex-wrap items-end gap-5">
      <div className="min-w-0 flex-1">
        <h1 className="mb-1">{sprint.name}</h1>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
          <Badge
            className={cn(
              "px-2.5 py-[3px] text-[11px]",
              isActive
                ? "bg-(--sp-accent) text-(--sp-bg)"
                : "bg-(--sp-neutral-200) text-(--sp-neutral-800)"
            )}
          >
            {SPRINT_STATUS_LABEL[sprint.status]}
          </Badge>
          <span>{formatDateRange(sprint.startDate, sprint.endDate)}</span>
          {sprint.goal ? (
            <span className="hidden text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)] md:inline">
              <span aria-hidden className="mr-2.5">·</span>
              {sprint.goal}
            </span>
          ) : null}
        </div>
      </div>

      <div className="w-full shrink-0 sm:w-[220px]">
        <div className="mb-[5px] flex justify-between text-[12px]">
          <span>
            {completedPoints} / {totalPoints || 0} points
          </span>
          {isActive ? (
            <span
              className={cn(
                "text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]",
                remaining < 0 && "text-(--sp-accent-700)"
              )}
            >
              {remaining < 0
                ? `${Math.abs(remaining)} days over`
                : `${remaining} days left`}
            </span>
          ) : null}
        </div>
        <div
          className="h-1.5 bg-(--sp-neutral-200)"
          role="progressbar"
          aria-valuenow={completedPoints}
          aria-valuemin={0}
          aria-valuemax={totalPoints || 0}
          aria-label={`${sprint.name} progress`}
        >
          <div
            className="h-full bg-(--sp-accent)"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
