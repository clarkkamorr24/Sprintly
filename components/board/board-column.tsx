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
import type { BoardColumnDTO, SprintDTO, TaskCardDTO } from "@/types/dto";

interface BoardColumnProps {
  readonly column: BoardColumnDTO;
  readonly columns: readonly BoardColumnDTO[];
  readonly sprints: readonly SprintDTO[];
  readonly canCreateTask: boolean;
  readonly onOpenTask: (taskId: string) => void;
  readonly onAddTask: (columnId: string) => void;
  readonly onMoveTask: (taskId: string, columnId: string) => void;
  readonly onAssignSprint: (taskId: string, sprintId: string | null) => void;
  readonly onDeleteTask: (task: TaskCardDTO) => void;
  readonly columnMenu?: React.ReactNode;
}

export function BoardColumn({
  column,
  columns,
  sprints,
  canCreateTask,
  onOpenTask,
  onAddTask,
  onMoveTask,
  onAssignSprint,
  onDeleteTask,
  columnMenu,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column" },
  });

  const headingId = `column-heading-${column.id}`;
  const points = column.tasks.reduce(
    (total, task) => total + (task.storyPoints ?? 0),
    0
  );

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-[86vw] shrink-0 flex-col border-r border-(--sp-neutral-300) sm:w-[274px]"
    >
      <header className="flex items-center gap-2 border-b border-(--sp-neutral-300) px-3.5 py-[11px]">
        <h3
          id={headingId}
          className="text-[11px] font-extrabold uppercase tracking-[0.08em]"
        >
          {column.name}
        </h3>
        <span className="text-[11px] font-extrabold text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
          {column.tasks.length}
        </span>
        {points > 0 ? (
          <span className="ml-auto text-[11px] text-[color-mix(in_srgb,var(--sp-text)_62%,transparent)]">
            {points} pts
          </span>
        ) : null}
        {columnMenu ? <div className="ml-auto">{columnMenu}</div> : null}
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[420px] flex-1 flex-col gap-2 p-2.5 transition-colors",
          isOver && "bg-[color-mix(in_srgb,var(--sp-accent)_6%,transparent)]"
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
                    sprints={sprints}
                    onOpen={() => onOpenTask(task.id)}
                    onMove={(columnId) => onMoveTask(task.id, columnId)}
                    onAssignSprint={(sprintId) =>
                      onAssignSprint(task.id, sprintId)
                    }
                    onDelete={() => onDeleteTask(task)}
                  />
                }
              />
            ))}
          </ul>
        </SortableContext>

        {isOver ? (
          <div>
            <div aria-hidden className="mb-2 h-0.5 bg-(--sp-accent)" />
            <div className="flex h-[78px] items-center justify-center border-2 border-dashed border-(--sp-accent) bg-[color-mix(in_srgb,var(--sp-accent)_6%,transparent)] text-[11px] font-extrabold uppercase tracking-[0.08em] text-(--sp-accent-700)">
              Drop in {column.name}
            </div>
          </div>
        ) : null}

        {column.tasks.length === 0 && !isOver ? (
          <p className="px-2 py-6 text-center text-xs text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
            No issues
          </p>
        ) : null}

        {canCreateTask ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-auto w-full justify-start gap-1.5 px-2 text-[12px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]"
            onClick={() => onAddTask(column.id)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="size-[13px]" />
            Add issue
          </Button>
        ) : null}
      </div>
    </section>
  );
}
