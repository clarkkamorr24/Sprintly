"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTaskAction } from "@/app/actions/task-actions";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { KanbanBoard } from "@/components/board/kanban-board";
import { SprintSelector } from "@/components/board/sprint-selector";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { REALTIME_EVENT, projectChannel } from "@/types/realtime";
import { assignTaskToSprintAction } from "@/app/actions/sprint-actions";
import type { BoardColumnDTO, SprintDTO, TaskCardDTO, UserDTO } from "@/types/dto";

interface BoardViewProps {
  readonly projectId: string;
  readonly columns: readonly BoardColumnDTO[];
  readonly sprints: readonly SprintDTO[];
  readonly selectedSprintNumber: number | null;
  readonly members: readonly UserDTO[];
  readonly canCreateTask: boolean;
  readonly canComment: boolean;
  readonly currentUserId: string;
}

export function BoardView({
  projectId,
  columns,
  sprints,
  selectedSprintNumber,
  members,
  canCreateTask,
  canComment,
  currentUserId,
}: BoardViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [addToColumn, setAddToColumn] = useState<string | null>(null);
  const [dismissedTaskId, setDismissedTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskCardDTO | null>(null);

  const linkedTaskId = searchParams.get("task");
  const openTaskId =
    selectedTaskId ??
    (linkedTaskId && linkedTaskId !== dismissedTaskId ? linkedTaskId : null);

  const closeTask = () => {
    if (selectedTaskId) {
      setSelectedTaskId(null);
      return;
    }

    if (linkedTaskId) {
      setDismissedTaskId(linkedTaskId);

      const params = new URLSearchParams(searchParams);
      params.delete("task");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
  };

  useRealtimeChannel({
    channel: projectChannel(projectId),
    event: REALTIME_EVENT.BOARD_CHANGED,
    onEvent: (payload) => {
      if (payload.actorId === currentUserId) return;
      router.refresh();
    },
  });

  const boardKey = [
    projectId,
    ...columns.map(
      (column) => `${column.id}:${column.tasks.map((t) => t.id).join(",")}`
    ),
  ].join("|");

  const confirmDelete = () => {
    const task = pendingDelete;
    if (!task) return;

    startTransition(async () => {
      const result = await deleteTaskAction({ taskId: task.id });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setPendingDelete(null);
      toast.success(`Deleted "${task.title}".`);
      router.refresh();
    });
  };

  const handleAssignSprint = (taskId: string, sprintId: string | null) => {
    startTransition(async () => {
      const result = await assignTaskToSprintAction({ taskId, sprintId });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(sprintId ? "Added to sprint." : "Removed from sprint.");
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-(--sp-neutral-300) px-4 py-2.5">
        <SprintSelector
          sprints={sprints}
          selectedSprintNumber={selectedSprintNumber}
        />
      </div>

      <KanbanBoard
        key={boardKey}
        initialColumns={columns}
        sprints={sprints}
        canCreateTask={canCreateTask}
        onOpenTask={(taskId) => setSelectedTaskId(taskId)}
        onAddTask={(columnId) => setAddToColumn(columnId)}
        onDeleteTask={setPendingDelete}
        onAssignSprint={handleAssignSprint}
      />

      <CreateTaskDialog
        projectId={projectId}
        columnId={addToColumn}
        members={members}
        open={addToColumn !== null}
        onOpenChange={(open) => {
          if (!open) setAddToColumn(null);
        }}
      />

      <TaskDetailDialog
        taskId={openTaskId}
        canComment={canComment}
        onOpenChange={(open) => {
          if (!open) closeTask();
        }}
        onMutated={() => router.refresh()}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this issue?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" and its comments, subtasks and activity will be permanently deleted. This cannot be undone.`
            : ""
        }
        isPending={isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      />
    </div>
  );
}
