"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";

import { BoardColumn } from "@/components/board/board-column";
import { TaskCard } from "@/components/board/task-card";
import { useBoard } from "@/hooks/use-board";
import type { BoardColumnDTO, TaskCardDTO } from "@/types/dto";

interface KanbanBoardProps {
  readonly initialColumns: readonly BoardColumnDTO[];
  readonly canCreateTask: boolean;
  readonly onOpenTask: (taskId: string) => void;
  readonly onAddTask: (columnId: string) => void;
  readonly onDeleteTask: (task: TaskCardDTO) => void;
  readonly renderColumnMenu?: (column: BoardColumnDTO) => React.ReactNode;
}

export function KanbanBoard({
  initialColumns,
  canCreateTask,
  onOpenTask,
  onAddTask,
  onDeleteTask,
  renderColumnMenu,
}: KanbanBoardProps) {
  const { columns, moveTask, findTask, locate } = useBoard(initialColumns);
  const [activeTask, setActiveTask] = useState<TaskCardDTO | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnNameOf = useCallback(
    (columnId: string) => columns.find((c) => c.id === columnId)?.name ?? "",
    [columns]
  );

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) => {
        const task = findTask(String(active.id));
        return task ? `Picked up ${task.title}.` : "Picked up task.";
      },
      onDragOver: ({ active, over }) => {
        if (!over) return undefined;
        const task = findTask(String(active.id));
        const target =
          columnNameOf(String(over.id)) ||
          columnNameOf(locate(String(over.id))?.columnId ?? "");
        return task && target ? `${task.title} is over ${target}.` : undefined;
      },
      onDragEnd: ({ active, over }) => {
        const task = findTask(String(active.id));
        if (!task || !over) return "Move cancelled.";
        const target =
          columnNameOf(String(over.id)) ||
          columnNameOf(locate(String(over.id))?.columnId ?? "");
        return `${task.title} dropped into ${target}.`;
      },
      onDragCancel: () => "Move cancelled.",
    }),
    [findTask, columnNameOf, locate]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(findTask(String(event.active.id)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
      moveTask(taskId, { columnId: overColumn.id, index: overColumn.tasks.length });
      return;
    }

    const target = locate(overId);
    if (!target) return;

    const from = locate(taskId);
    const sameColumn = from?.columnId === target.columnId;
    const index =
      sameColumn && from && from.index < target.index
        ? target.index
        : target.index;

    moveTask(taskId, { columnId: target.columnId, index });
  };

  const handleMenuMove = (taskId: string, columnId: string) => {
    const target = columns.find((c) => c.id === columnId);
    moveTask(taskId, { columnId, index: target?.tasks.length ?? 0 });
  };

  return (
    <DndContext
      id="sprintly-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            columns={columns}
            canCreateTask={canCreateTask}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
            onMoveTask={handleMenuMove}
            onDeleteTask={onDeleteTask}
            columnMenu={renderColumnMenu?.(column)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-72 rotate-2 sm:w-80">
            <TaskCard task={activeTask} onOpen={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
