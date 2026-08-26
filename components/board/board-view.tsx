"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTaskAction } from "@/app/actions/task-actions";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { KanbanBoard } from "@/components/board/kanban-board";
import type { BoardColumnDTO, TaskCardDTO, UserDTO } from "@/types/dto";

interface BoardViewProps {
  readonly projectId: string;
  readonly columns: readonly BoardColumnDTO[];
  readonly members: readonly UserDTO[];
  readonly canCreateTask: boolean;
}

export function BoardView({
  projectId,
  columns,
  members,
  canCreateTask,
}: BoardViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [addToColumn, setAddToColumn] = useState<string | null>(null);

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
      <KanbanBoard
        initialColumns={columns}
        canCreateTask={canCreateTask}
        onOpenTask={() => toast.info("Task details arrive in the next stage.")}
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
    </>
  );
}
