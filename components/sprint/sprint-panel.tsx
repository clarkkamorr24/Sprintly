"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import {
  changeSprintStatusAction,
  deleteSprintAction,
} from "@/app/actions/sprint-actions";
import { SprintDialog } from "@/components/sprint/sprint-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import {
  daysRemaining,
  formatDateRange,
  SPRINT_STATUS_LABEL,
  SPRINT_STATUS_STYLE,
} from "@/lib/sprint-display";
import { cn } from "@/lib/utils";
import type { SprintDTO } from "@/types/dto";

interface SprintPanelProps {
  readonly projectId: string;
  readonly sprints: readonly SprintDTO[];
  readonly canManage: boolean;
}

export function SprintPanel({
  projectId,
  sprints,
  canManage,
}: SprintPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SprintDTO | null>(null);

  const runStatusChange = (sprint: SprintDTO, status: SprintStatus) => {
    startTransition(async () => {
      const result = await changeSprintStatusAction({
        sprintId: sprint.id,
        status,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        status === SprintStatus.ACTIVE
          ? `Started ${sprint.name}.`
          : `Completed ${sprint.name}.`
      );
      router.refresh();
    });
  };

  const runDelete = (sprint: SprintDTO) => {
    startTransition(async () => {
      const result = await deleteSprintAction({ sprintId: sprint.id });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(`Deleted ${sprint.name}.`);
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="sprints-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="sprints-heading" className="text-sm font-semibold">
          Sprints
        </h2>
        {canManage ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New sprint
          </Button>
        ) : null}
      </div>

      {sprints.length === 0 ? (
        <EmptyState
          title="No sprints yet"
          description={
            canManage
              ? "Create a sprint to plan work into a fixed time box."
              : "An admin can create the first sprint."
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sprints.map((sprint) => {
            const remaining = daysRemaining(sprint.endDate);
            const progress = sprint.taskCount
              ? Math.round((sprint.completedCount / sprint.taskCount) * 100)
              : 0;

            return (
              <li
                key={sprint.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-medium">
                        {sprint.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={SPRINT_STATUS_STYLE[sprint.status]}
                      >
                        {SPRINT_STATUS_LABEL[sprint.status]}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatDateRange(sprint.startDate, sprint.endDate)}
                      {sprint.status === SprintStatus.ACTIVE ? (
                        <span
                          className={cn(remaining < 0 && "text-destructive")}
                        >
                          {" · "}
                          {remaining < 0
                            ? `${Math.abs(remaining)}d overdue`
                            : `${remaining}d left`}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  {canManage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Actions for ${sprint.name}`}
                            className="text-muted-foreground/60 hover:text-foreground"
                          >
                            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          {sprint.status === SprintStatus.PLANNED ? (
                            <DropdownMenuItem
                              disabled={isPending}
                              onClick={() =>
                                runStatusChange(sprint, SprintStatus.ACTIVE)
                              }
                            >
                              Start sprint
                            </DropdownMenuItem>
                          ) : null}

                          {sprint.status === SprintStatus.ACTIVE ? (
                            <DropdownMenuItem
                              disabled={isPending}
                              onClick={() =>
                                runStatusChange(sprint, SprintStatus.COMPLETED)
                              }
                            >
                              Complete sprint
                            </DropdownMenuItem>
                          ) : null}

                          <DropdownMenuItem
                            disabled={isPending}
                            onClick={() => {
                              setEditing(sprint);
                              setDialogOpen(true);
                            }}
                          >
                            Edit sprint
                          </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => runDelete(sprint)}
                          >
                            Delete sprint
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>

                {sprint.goal ? (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {sprint.goal}
                  </p>
                ) : null}

                <div className="mt-3 space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="tabular-nums text-muted-foreground">
                      {sprint.completedCount}/{sprint.taskCount}
                      <span className="sr-only"> tasks complete ({progress}%)</span>
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SprintDialog
        projectId={projectId}
        sprint={editing}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      />
    </section>
  );
}
