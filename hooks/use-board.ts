"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import { moveTaskAction } from "@/app/actions/board-actions";
import type { BoardColumnDTO, TaskCardDTO } from "@/types/dto";

export interface TaskLocation {
  readonly columnId: string;
  readonly index: number;
}

function locate(
  columns: readonly BoardColumnDTO[],
  taskId: string
): TaskLocation | null {
  for (const column of columns) {
    const index = column.tasks.findIndex((task) => task.id === taskId);
    if (index !== -1) return { columnId: column.id, index };
  }
  return null;
}

function applyMove(
  columns: readonly BoardColumnDTO[],
  taskId: string,
  to: TaskLocation
): readonly BoardColumnDTO[] {
  const from = locate(columns, taskId);
  if (!from) return columns;

  const task = columns
    .find((c) => c.id === from.columnId)
    ?.tasks.find((t) => t.id === taskId);
  if (!task) return columns;

  const withoutTask = columns.map((column) =>
    column.id === from.columnId
      ? { ...column, tasks: column.tasks.filter((t) => t.id !== taskId) }
      : column
  );

  return withoutTask.map((column) => {
    if (column.id !== to.columnId) return column;

    const next = [...column.tasks];
    const index = Math.min(to.index, next.length);
    next.splice(index, 0, { ...task, columnId: to.columnId });

    return { ...column, tasks: next };
  });
}

export function useBoard(initialColumns: readonly BoardColumnDTO[]) {
  const [columns, setColumns] = useState(initialColumns);
  const [isSaving, startTransition] = useTransition();

  const syncFromServer = useCallback((next: readonly BoardColumnDTO[]) => {
    setColumns(next);
  }, []);

  const moveTask = useCallback(
    (taskId: string, to: TaskLocation) => {
      const previous = columns;
      const from = locate(columns, taskId);

      if (!from) return;
      if (from.columnId === to.columnId && from.index === to.index) return;

      const optimistic = applyMove(columns, taskId, to);
      setColumns(optimistic);

      startTransition(async () => {
        const result = await moveTaskAction({
          taskId,
          toColumnId: to.columnId,
          toIndex: to.index,
        });

        if (!result.success) {
          setColumns(previous);
          toast.error(result.error.message);
        }
      });
    },
    [columns]
  );

  const findTask = useCallback(
    (taskId: string): TaskCardDTO | null => {
      for (const column of columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) return task;
      }
      return null;
    },
    [columns]
  );

  return { columns, moveTask, findTask, locate: (id: string) => locate(columns, id), isSaving, syncFromServer };
}
