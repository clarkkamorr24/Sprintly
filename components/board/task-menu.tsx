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
import type { BoardColumnDTO, TaskCardDTO } from "@/types/dto";

interface TaskMenuProps {
  readonly task: TaskCardDTO;
  readonly columns: readonly BoardColumnDTO[];
  readonly onMove: (columnId: string) => void;
  readonly onOpen: () => void;
  readonly onDelete?: () => void;
}

export function TaskMenu({
  task,
  columns,
  onMove,
  onOpen,
  onDelete,
}: TaskMenuProps) {
  const targets = columns.filter((column) => column.id !== task.columnId);

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
