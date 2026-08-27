"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { assignTaskToSprintAction } from "@/app/actions/sprint-actions";
import { changeSprintStatusAction } from "@/app/actions/sprint-actions";
import { InitialsTile } from "@/components/shared/initials-tile";
import { PriorityTag } from "@/components/shared/priority-tag";
import { SprintDialog } from "@/components/sprint/sprint-dialog";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import {
  ISSUE_TYPE_COLOR,
  ISSUE_TYPE_LABEL,
  ISSUE_TYPE_LETTER,
} from "@/lib/issue-display";
import {
  formatDateRange,
  SPRINT_STATUS_LABEL,
  SPRINT_STATUS_STYLE,
} from "@/lib/sprint-display";
import type { BacklogGroup } from "@/services/board-service";
import type { SprintDTO, TaskCardDTO } from "@/types/dto";

interface SprintPlanningProps {
  readonly projectId: string;
  readonly sprints: readonly SprintDTO[];
  readonly backlogTasks: readonly TaskCardDTO[];
  readonly groups: readonly BacklogGroup[];
  readonly canManage: boolean;
  readonly canAssign: boolean;
  readonly canComment: boolean;
}

function PlanningRow({
  task,
  onOpen,
  action,
}: {
  readonly task: TaskCardDTO;
  readonly onOpen: (id: string) => void;
  readonly action: React.ReactNode;
}) {
  return (
    <li className="sp-card-hover flex min-w-0 items-center gap-2 border border-(--sp-neutral-300) bg-(--sp-neutral-100) px-3 py-2.5">
      <span
        aria-label={ISSUE_TYPE_LABEL[task.type]}
        className="flex size-[15px] shrink-0 items-center justify-center border text-[9px] font-extrabold"
        style={{
          borderColor: ISSUE_TYPE_COLOR[task.type],
          color: ISSUE_TYPE_COLOR[task.type],
        }}
      >
        {ISSUE_TYPE_LETTER[task.type]}
      </span>

      <span className="sp-mono-key hidden shrink-0 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)] sm:inline">
        {task.key}
      </span>

      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="min-w-0 flex-1 truncate text-left text-[13.5px] outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {task.title}
      </button>

      <PriorityTag priority={task.priority} className="hidden md:inline-flex" />

      {task.assignees[0] ? (
        <span className="hidden sm:block">
          <InitialsTile user={task.assignees[0]} size="xs" />
        </span>
      ) : null}

      {task.storyPoints !== null ? (
        <span className="shrink-0 text-[12px] font-extrabold">
          {task.storyPoints}
        </span>
      ) : null}

      {action}
    </li>
  );
}

export function SprintPlanning({
  projectId,
  sprints,
  backlogTasks,
  groups,
  canManage,
  canAssign,
  canComment,
}: SprintPlanningProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SprintDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openSprints = sprints.filter(
    (sprint) => sprint.status !== SprintStatus.COMPLETED
  );

  const [targetId, setTargetId] = useState<string>(openSprints[0]?.id ?? "");
  const target = openSprints.find((sprint) => sprint.id === targetId) ?? null;
  const targetTasks =
    groups.find((group) => group.sprint?.id === targetId)?.tasks ?? [];
  const targetPoints = targetTasks.reduce(
    (sum, task) => sum + (task.storyPoints ?? 0),
    0
  );

  const assign = (taskId: string, sprintId: string | null, label: string) => {
    startTransition(async () => {
      const result = await assignTaskToSprintAction({ taskId, sprintId });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(label);
      router.refresh();
    });
  };

  const start = () => {
    if (!target) return;

    startTransition(async () => {
      const result = await changeSprintStatusAction({
        sprintId: target.id,
        status: SprintStatus.ACTIVE,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(`Started ${target.name}.`);
      router.refresh();
    });
  };

  if (openSprints.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <div className="sp-panel p-6 text-center">
          <h2 className="mb-1 text-[20px]">No sprints yet</h2>
          <p className="mb-4 text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
            {canManage
              ? "Create a sprint to plan work into a fixed time box."
              : "An admin can create the first sprint."}
          </p>
          {canManage ? (
            <Button onClick={() => setDialogOpen(true)}>Create sprint</Button>
          ) : null}
        </div>

        <SprintDialog
          projectId={projectId}
          sprint={null}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-(--sp-neutral-300) px-4 py-3 lg:px-6">
        <Select
          items={openSprints.map((s) => ({ value: s.id, label: s.name }))}
          value={targetId}
          onValueChange={(value) => setTargetId(String(value))}
        >
          <SelectTrigger size="sm" aria-label="Sprint to plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {openSprints.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>
                {sprint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canManage ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(target);
                setDialogOpen(true);
              }}
            >
              Edit sprint
            </Button>
            {target?.status === SprintStatus.PLANNED ? (
              <Button size="sm" onClick={start} disabled={isPending}>
                Start {target.name}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              New sprint
            </Button>
          </>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <section
          aria-labelledby="plan-backlog"
          className="flex min-w-0 flex-col border-b border-(--sp-neutral-300) lg:border-r lg:border-b-0"
        >
          <header className="flex items-center gap-2 border-b border-(--sp-neutral-300) px-4 py-3 lg:px-5">
            <h2
              id="plan-backlog"
              className="text-[13px] font-extrabold uppercase tracking-[0.08em]"
            >
              Backlog
            </h2>
            <span className="text-[12px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
              {backlogTasks.length}{" "}
              {backlogTasks.length === 1 ? "issue" : "issues"}
            </span>
          </header>

          {backlogTasks.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
              The backlog is empty.
            </p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-2 p-4 lg:px-5">
              {backlogTasks.map((task) => (
                <PlanningRow
                  key={task.id}
                  task={task}
                  onOpen={setOpenTaskId}
                  action={
                    canAssign && target ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="shrink-0 text-(--sp-accent)"
                        disabled={isPending}
                        onClick={() =>
                          assign(task.id, target.id, `Added to ${target.name}.`)
                        }
                      >
                        Add →
                      </Button>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="plan-sprint"
          className="flex min-w-0 flex-col bg-[color-mix(in_srgb,var(--sp-text)_3%,transparent)]"
        >
          <header className="border-b border-(--sp-neutral-300) px-4 py-3 lg:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="plan-sprint"
                className="text-[13px] font-extrabold uppercase tracking-[0.08em]"
              >
                {target?.name ?? "Sprint"}
              </h2>
              {target ? (
                <Badge
                  variant="outline"
                  className={SPRINT_STATUS_STYLE[target.status]}
                >
                  {SPRINT_STATUS_LABEL[target.status]}
                </Badge>
              ) : null}
              <span className="ml-auto text-[12px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
                {targetTasks.length}{" "}
                {targetTasks.length === 1 ? "issue" : "issues"} · {targetPoints}{" "}
                points
              </span>
            </div>
            {target ? (
              <p className="mt-1.5 text-[12px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
                {formatDateRange(target.startDate, target.endDate)}
                {target.goal ? ` · ${target.goal}` : ""}
              </p>
            ) : null}
          </header>

          {targetTasks.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
              Add issues from the backlog to plan this sprint.
            </p>
          ) : (
            <ul className="flex min-w-0 flex-col gap-2 p-4 lg:px-5">
              {targetTasks.map((task) => (
                <PlanningRow
                  key={task.id}
                  task={task}
                  onOpen={setOpenTaskId}
                  action={
                    canAssign ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="shrink-0 text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]"
                        disabled={isPending}
                        onClick={() =>
                          assign(task.id, null, "Removed from sprint.")
                        }
                      >
                        Remove
                      </Button>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <SprintDialog
        projectId={projectId}
        sprint={editing}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
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
