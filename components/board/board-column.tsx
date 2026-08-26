"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

import { SortableTask } from "@/components/board/sortable-task";
import { TaskMenu } from "@/components/board/task-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BoardColumnDTO, TaskCardDTO } from "@/types/dto";

interface BoardColumnProps {
  readonly column: BoardColumnDTO;
  readonly columns: readonly BoardColumnDTO[];
  readonly canCreateTask: boolean;
  readonly onOpenTask: (taskId: string) => void;
  readonly onAddTask: (columnId: string) => void;
  readonly onMoveTask: (taskId: string, columnId: string) => void;
  readonly onDeleteTask: (task: TaskCardDTO) => void;
  readonly columnMenu?: React.ReactNode;
}

export function BoardColumn({
  column,
  columns,
  canCreateTask,
  onOpenTask,
  onAddTask,
  onMoveTask,
  onDeleteTask,
  columnMenu,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column" },
  });

  const headingId = `column-heading-${column.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40 sm:w-80"
    >
      <header className="flex items-center gap-2 px-3 py-2.5">
        <h3 id={headingId} className="text-sm font-semibold">
          {column.name}
        </h3>
        <span
          className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground"
          aria-label={`${column.tasks.length} tasks`}
        >
          {column.tasks.length}
        </span>
        {columnMenu ? <div className="ml-auto">{columnMenu}</div> : null}
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-lg px-2 pb-2 transition-colors",
          isOver && "bg-accent/60 ring-2 ring-ring/40 ring-inset"
        )}
      >
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {column.tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                onOpen={onOpenTask}
                menu={
                  <TaskMenu
                    task={task}
                    columns={columns}
                    onOpen={() => onOpenTask(task.id)}
                    onMove={(columnId) => onMoveTask(task.id, columnId)}
                    onDelete={() => onDeleteTask(task)}
                  />
                }
              />
            ))}
          </ul>
        </SortableContext>

        {column.tasks.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No tasks
          </p>
        ) : null}

        {canCreateTask ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground"
            onClick={() => onAddTask(column.id)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            Add task
          </Button>
        ) : null}
      </div>
    </section>
  );
}
