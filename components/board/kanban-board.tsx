"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";

import { BoardColumn } from "@/components/board/board-column";
import { TaskCard } from "@/components/board/task-card";
import { CardPointerSensor, CardTouchSensor } from "@/lib/dnd-sensors";
import { useBoard } from "@/hooks/use-board";
import type { BoardColumnDTO, SprintDTO, TaskCardDTO } from "@/types/dto";

interface KanbanBoardProps {
  readonly initialColumns: readonly BoardColumnDTO[];
  readonly sprints: readonly SprintDTO[];
  readonly canCreateTask: boolean;
  readonly onOpenTask: (taskId: string) => void;
  readonly onAddTask: (columnId: string) => void;
  readonly onDeleteTask: (task: TaskCardDTO) => void;
  readonly onAssignSprint: (taskId: string, sprintId: string | null) => void;
  readonly renderColumnMenu?: (column: BoardColumnDTO) => React.ReactNode;
}

export function KanbanBoard({
  initialColumns,
  sprints,
  canCreateTask,
  onOpenTask,
  onAddTask,
  onDeleteTask,
  onAssignSprint,
  renderColumnMenu,
}: KanbanBoardProps) {
  const {
    columns,
    beginDrag,
    previewMove,
    commitMove,
    cancelDrag,
    moveTask,
    findTask,
    locate,
  } = useBoard(initialColumns);

  const [activeTask, setActiveTask] = useState<TaskCardDTO | null>(null);

  const sensors = useSensors(
    useSensor(CardPointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(CardTouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0
      ? pointerCollisions
      : rectIntersection(args);
  }, []);

  const columnNameOf = useCallback(
    (columnId: string) => columns.find((c) => c.id === columnId)?.name ?? "",
    [columns]
  );

  const resolveTarget = useCallback(
    (overId: string): { columnId: string; index: number } | null => {
      const column = columns.find((c) => c.id === overId);
      if (column) return { columnId: column.id, index: column.tasks.length };

      const overTask = locate(overId);
      if (overTask) return overTask;

      return null;
    },
    [columns, locate]
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
        const target = resolveTarget(String(over.id));
        if (!task || !target) return undefined;
        return `${task.title} is over ${columnNameOf(target.columnId)}.`;
      },
      onDragEnd: ({ active, over }) => {
        const task = findTask(String(active.id));
        if (!task || !over) return "Move cancelled.";
        const target = resolveTarget(String(over.id));
        if (!target) return "Move cancelled.";
        return `${task.title} dropped into ${columnNameOf(target.columnId)}.`;
      },
      onDragCancel: () => "Move cancelled.",
    }),
    [findTask, columnNameOf, resolveTarget]
  );

  const handleDragStart = (event: DragStartEvent) => {
    beginDrag();
    setActiveTask(findTask(String(event.active.id)));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const target = resolveTarget(String(over.id));
    if (!target) return;

    const from = locate(taskId);
    if (!from) return;
    if (from.columnId === target.columnId) return;

    previewMove(taskId, target);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    const taskId = String(active.id);

    if (!over) {
      cancelDrag();
      return;
    }

    const target = resolveTarget(String(over.id));
    if (!target) {
      cancelDrag();
      return;
    }

    const from = locate(taskId);
    if (from && from.columnId === target.columnId) {
      previewMove(taskId, target);
    }

    commitMove(taskId);
  };

  const handleMenuMove = (taskId: string, columnId: string) => {
    const target = columns.find((c) => c.id === columnId);
    moveTask(taskId, { columnId, index: target?.tasks.length ?? 0 });
  };

  return (
    <DndContext
      id="sprintly-board"
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveTask(null);
        cancelDrag();
      }}
    >
      <div className="flex w-full flex-1 items-stretch overflow-x-auto">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            columns={columns}
            sprints={sprints}
            canCreateTask={canCreateTask}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
            onMoveTask={handleMenuMove}
            onAssignSprint={onAssignSprint}
            onDeleteTask={onDeleteTask}
            columnMenu={renderColumnMenu?.(column)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[274px] rotate-2">
            <TaskCard task={activeTask} onOpen={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
