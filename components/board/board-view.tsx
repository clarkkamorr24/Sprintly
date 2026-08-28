"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTaskAction } from "@/app/actions/task-actions";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { REALTIME_EVENT, projectChannel } from "@/types/realtime";
import { assignTaskToSprintAction } from "@/app/actions/sprint-actions";
import type { BoardColumnDTO, SprintDTO, TaskCardDTO, UserDTO } from "@/types/dto";

interface BoardViewProps {
  readonly projectId: string;
  readonly columns: readonly BoardColumnDTO[];
  readonly sprints: readonly SprintDTO[];
  readonly members: readonly UserDTO[];
  readonly canCreateTask: boolean;
  readonly canComment: boolean;
  readonly currentUserId: string;
}

export function BoardView({
  projectId,
  columns,
  sprints,
  members,
  canCreateTask,
  canComment,
  currentUserId,
}: BoardViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [addToColumn, setAddToColumn] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

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

  const handleDelete = (task: TaskCardDTO) => {
    startTransition(async () => {
      const result = await deleteTaskAction({ taskId: task.id });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

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
      <KanbanBoard
        key={boardKey}
        initialColumns={columns}
        sprints={sprints}
        canCreateTask={canCreateTask}
        onOpenTask={(taskId) => setOpenTaskId(taskId)}
        onAddTask={(columnId) => setAddToColumn(columnId)}
        onDeleteTask={handleDelete}
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
          if (!open) setOpenTaskId(null);
        }}
        onMutated={() => router.refresh()}
      />
    </div>
  );
}
