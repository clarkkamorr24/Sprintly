"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TaskCard } from "@/components/board/task-card";
import type { TaskCardDTO } from "@/types/dto";

interface SortableTaskProps {
  readonly task: TaskCardDTO;
  readonly onOpen: (taskId: string) => void;
  readonly menu?: React.ReactNode;
  readonly disabled?: boolean;
}

export function SortableTask({ task, onOpen, menu, disabled }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", columnId: task.columnId },
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <TaskCard
        task={task}
        onOpen={onOpen}
        isDragging={isDragging}
        menu={menu}
        dragHandleProps={disabled ? undefined : { ...attributes, ...listeners }}
      />
    </li>
  );
}
