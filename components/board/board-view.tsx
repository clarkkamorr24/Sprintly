"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTaskAction } from "@/app/actions/task-actions";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import type { BoardColumnDTO, TaskCardDTO, UserDTO } from "@/types/dto";

interface BoardViewProps {
  readonly projectId: string;
  readonly columns: readonly BoardColumnDTO[];
  readonly members: readonly UserDTO[];
  readonly canCreateTask: boolean;
  readonly canComment: boolean;
}

export function BoardView({
  projectId,
  columns,
  members,
  canCreateTask,
  canComment,
}: BoardViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [addToColumn, setAddToColumn] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const boardKey = columns
    .map((column) => `${column.id}:${column.tasks.map((t) => t.id).join(",")}`)
    .join("|");

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

  return (
    <>
      {/* Keyed by the server's task set so a filter change remounts the board
          with fresh data instead of keeping stale optimistic state. */}
      <KanbanBoard
        key={boardKey}
        initialColumns={columns}
        canCreateTask={canCreateTask}
        onOpenTask={(taskId) => setOpenTaskId(taskId)}
        onAddTask={(columnId) => setAddToColumn(columnId)}
        onDeleteTask={handleDelete}
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
    </>
  );
}
