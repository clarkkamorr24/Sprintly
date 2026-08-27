"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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
    const index = Math.min(Math.max(to.index, 0), next.length);
    next.splice(index, 0, { ...task, columnId: to.columnId });

    return { ...column, tasks: next };
  });
}

export function useBoard(initialColumns: readonly BoardColumnDTO[]) {
  const [columns, setColumns] = useState(initialColumns);
  const [isSaving, startTransition] = useTransition();

  const current = useRef(columns);
  const beforeDrag = useRef<readonly BoardColumnDTO[] | null>(null);

  useEffect(() => {
    current.current = columns;
  }, [columns]);

  const commit = useCallback((next: readonly BoardColumnDTO[]) => {
    current.current = next;
    setColumns(next);
  }, []);

  const persist = useCallback(
    (taskId: string, to: TaskLocation, rollbackTo: readonly BoardColumnDTO[]) => {
      startTransition(async () => {
        const result = await moveTaskAction({
          taskId,
          toColumnId: to.columnId,
          toIndex: to.index,
        });

        if (!result.success) {
          commit(rollbackTo);
          toast.error(result.error.message);
        }
      });
    },
    [commit]
  );

  const beginDrag = useCallback(() => {
    beforeDrag.current = current.current;
  }, []);

  const previewMove = useCallback(
    (taskId: string, to: TaskLocation) => {
      const from = locate(current.current, taskId);
      if (!from) return;
      if (from.columnId === to.columnId && from.index === to.index) return;

      commit(applyMove(current.current, taskId, to));
    },
    [commit]
  );

  const cancelDrag = useCallback(() => {
    if (beforeDrag.current) commit(beforeDrag.current);
    beforeDrag.current = null;
  }, [commit]);

  const commitMove = useCallback(
    (taskId: string) => {
      const rollbackTo = beforeDrag.current;
      beforeDrag.current = null;

      const destination = locate(current.current, taskId);
      if (!destination || !rollbackTo) return;

      const origin = locate(rollbackTo, taskId);
      const unchanged =
        origin &&
        origin.columnId === destination.columnId &&
        origin.index === destination.index;

      if (unchanged) return;

      persist(taskId, destination, rollbackTo);
    },
    [persist]
  );

  const moveTask = useCallback(
    (taskId: string, to: TaskLocation) => {
      const previous = current.current;
      const from = locate(previous, taskId);

      if (!from) return;
      if (from.columnId === to.columnId && from.index === to.index) return;

      commit(applyMove(previous, taskId, to));
      persist(taskId, to, previous);
    },
    [commit, persist]
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

  return {
    columns,
    beginDrag,
    previewMove,
    commitMove,
    cancelDrag,
    moveTask,
    findTask,
    locate: (id: string) => locate(columns, id),
    isSaving,
  };
}
