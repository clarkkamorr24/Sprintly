"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { changeSprintStatusAction } from "@/app/actions/sprint-actions";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { IssueRow } from "@/components/board/issue-row";
import { EmptyState } from "@/components/shared/empty-state";
import { SprintDialog } from "@/components/sprint/sprint-dialog";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import {
  formatDateRange,
  SPRINT_STATUS_LABEL,
  SPRINT_STATUS_STYLE,
} from "@/lib/sprint-display";
import type { BacklogGroup } from "@/services/board-service";
import type { UserDTO } from "@/types/dto";

interface BacklogViewProps {
  readonly projectId: string;
  readonly groups: readonly BacklogGroup[];
  readonly columnNames: Readonly<Record<string, string>>;
  readonly members: readonly UserDTO[];
  readonly canManageSprints: boolean;
  readonly canCreateTask: boolean;
  readonly canComment: boolean;
  readonly defaultColumnId: string;
}

export function BacklogView({
  projectId,
  groups,
  columnNames,
  members,
  canManageSprints,
  canCreateTask,
  canComment,
  defaultColumnId,
}: BacklogViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);

  const hasActive = groups.some(
    (group) => group.sprint?.status === SprintStatus.ACTIVE
  );

  const startSprint = (sprintId: string, name: string) => {
    startTransition(async () => {
      const result = await changeSprintStatusAction({
        sprintId,
        status: SprintStatus.ACTIVE,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(`Started ${name}.`);
      router.refresh();
    });
  };

  const totalIssues = groups.reduce(
    (sum, group) => sum + group.tasks.length,
    0
  );

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        {canManageSprints ? (
          <Button variant="outline" onClick={() => setSprintDialogOpen(true)}>
            New sprint
          </Button>
        ) : null}
        {canCreateTask && defaultColumnId ? (
          <Button onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} data-icon="inline-start" />
            Create issue
          </Button>
        ) : null}
      </div>

      {totalIssues === 0 ? (
        <EmptyState
          title="Nothing in the backlog"
          description={
            canCreateTask
              ? "Create an issue to start planning work."
              : "Issues will appear here once someone creates them."
          }
        />
      ) : (
        <div className="space-y-7">
          {groups.map((group) => {
            const key = group.sprint?.id ?? "unassigned";
            const name = group.sprint?.name ?? "Backlog";
            const canStart =
              canManageSprints &&
              group.sprint?.status === SprintStatus.PLANNED &&
              !hasActive;

            return (
              <section key={key} aria-labelledby={`group-${key}`}>
                <div className="sp-panel flex flex-wrap items-center gap-2.5 px-3 py-2.5">
                  <h2 id={`group-${key}`} className="text-[15px] font-extrabold">
                    {name}
                  </h2>

                  {group.sprint ? (
                    <Badge
                      variant="outline"
                      className={SPRINT_STATUS_STYLE[group.sprint.status]}
                    >
                      {SPRINT_STATUS_LABEL[group.sprint.status]}
                    </Badge>
                  ) : null}

                  <span className="text-[12px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
                    {group.tasks.length}{" "}
                    {group.tasks.length === 1 ? "issue" : "issues"}
                    {group.points > 0 ? ` · ${group.points} points` : ""}
                    {group.sprint
                      ? ` · ${formatDateRange(group.sprint.startDate, group.sprint.endDate)}`
                      : ""}
                  </span>

                  {canStart && group.sprint ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-(--sp-accent)"
                      disabled={isPending}
                      onClick={() =>
                        startSprint(group.sprint!.id, group.sprint!.name)
                      }
                    >
                      Start sprint
                    </Button>
                  ) : null}
                </div>

                {group.tasks.length === 0 ? (
                  <p className="border border-t-0 border-(--sp-neutral-300) px-3 py-5 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
                    No issues in {name.toLowerCase()}.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-t-0 border-(--sp-neutral-300)">
                    <table className="w-full border-collapse text-sm">
                      <caption className="sr-only">
                        Issues in {name}
                      </caption>
                      <tbody>
                        {group.tasks.map((task) => (
                          <IssueRow
                            key={task.id}
                            task={task}
                            columnName={columnNames[task.columnId]}
                            onOpen={setOpenTaskId}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <CreateTaskDialog
        projectId={projectId}
        columnId={createOpen ? defaultColumnId : null}
        members={members}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <SprintDialog
        projectId={projectId}
        sprint={null}
        open={sprintDialogOpen}
        onOpenChange={setSprintDialogOpen}
      />

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
