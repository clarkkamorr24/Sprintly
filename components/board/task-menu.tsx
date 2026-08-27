"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import type { BoardColumnDTO, SprintDTO, TaskCardDTO } from "@/types/dto";

interface TaskMenuProps {
  readonly task: TaskCardDTO;
  readonly columns: readonly BoardColumnDTO[];
  readonly sprints: readonly SprintDTO[];
  readonly onMove: (columnId: string) => void;
  readonly onAssignSprint: (sprintId: string | null) => void;
  readonly onOpen: () => void;
  readonly onDelete?: () => void;
}

export function TaskMenu({
  task,
  columns,
  sprints,
  onMove,
  onAssignSprint,
  onOpen,
  onDelete,
}: TaskMenuProps) {
  const targets = columns.filter((column) => column.id !== task.columnId);
  const openSprints = sprints.filter(
    (sprint) => sprint.status !== SprintStatus.COMPLETED
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Actions for ${task.title}`}
            className="text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onOpen}>Open details</DropdownMenuItem>
        </DropdownMenuGroup>

        {targets.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {targets.map((column) => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={() => onMove(column.id)}
                >
                  {column.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}

        {openSprints.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sprint</DropdownMenuLabel>
              {task.sprintId ? (
                <DropdownMenuItem onClick={() => onAssignSprint(null)}>
                  Remove from sprint
                </DropdownMenuItem>
              ) : null}
              {openSprints
                .filter((sprint) => sprint.id !== task.sprintId)
                .map((sprint) => (
                  <DropdownMenuItem
                    key={sprint.id}
                    onClick={() => onAssignSprint(sprint.id)}
                  >
                    {sprint.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
          </>
        ) : null}

        {onDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Delete task
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
