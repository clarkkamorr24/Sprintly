"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import {
  createSubtaskAction,
  deleteSubtaskAction,
  toggleSubtaskAction,
} from "@/app/actions/subtask-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SubtaskDTO } from "@/types/dto";

interface SubtaskListProps {
  readonly taskId: string;
  readonly subtasks: readonly SubtaskDTO[];
  readonly canEdit: boolean;
  readonly onChange: () => void;
}

export function SubtaskList({
  taskId,
  subtasks,
  canEdit,
  onChange,
}: SubtaskListProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [optimistic, setOptimistic] = useOptimistic(
    subtasks,
    (current, update: { id: string; isCompleted: boolean }) =>
      current.map((s) =>
        s.id === update.id ? { ...s, isCompleted: update.isCompleted } : s
      )
  );

  const completed = optimistic.filter((s) => s.isCompleted).length;

  const handleToggle = (subtask: SubtaskDTO, isCompleted: boolean) => {
    startTransition(async () => {
      setOptimistic({ id: subtask.id, isCompleted });

      const result = await toggleSubtaskAction({
        subtaskId: subtask.id,
        isCompleted,
      });

      if (!result.success) {
        toast.error(result.error.message);
      }

      onChange();
    });
  };

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;

    startTransition(async () => {
      const result = await createSubtaskAction({ taskId, title: value });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      setTitle("");
      onChange();
      inputRef.current?.focus();
    });
  };

  const handleDelete = (subtask: SubtaskDTO) => {
    startTransition(async () => {
      const result = await deleteSubtaskAction({ subtaskId: subtask.id });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      onChange();
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Subtasks</h3>
        {optimistic.length > 0 ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {completed} / {optimistic.length} completed
          </p>
        ) : null}
      </div>

      {optimistic.length > 0 ? (
        <>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={optimistic.length}
            aria-label="Subtask progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${optimistic.length ? (completed / optimistic.length) * 100 : 0}%`,
              }}
            />
          </div>

          <ul className="space-y-1">
            {optimistic.map((subtask) => (
              <li
                key={subtask.id}
                className="group/subtask flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60"
              >
                <Checkbox
                  id={`subtask-${subtask.id}`}
                  checked={subtask.isCompleted}
                  disabled={!canEdit || isPending}
                  onCheckedChange={(checked) => handleToggle(subtask, checked)}
                />
                <label
                  htmlFor={`subtask-${subtask.id}`}
                  className={cn(
                    "flex-1 cursor-pointer text-sm",
                    subtask.isCompleted && "text-muted-foreground line-through"
                  )}
                >
                  {subtask.title}
                </label>

                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete subtask ${subtask.title}`}
                    disabled={isPending}
                    onClick={() => handleDelete(subtask)}
                    className="text-muted-foreground/60 hover:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No subtasks yet.</p>
      )}

      {canEdit ? (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            ref={inputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a subtask"
            aria-label="New subtask title"
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending || !title.trim()}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            <span className="sr-only">Add subtask</span>
          </Button>
        </form>
      ) : null}
    </section>
  );
}
