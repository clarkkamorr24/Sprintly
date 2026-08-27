"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createSprintAction,
  updateSprintAction,
} from "@/app/actions/sprint-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/types/api";
import type { SprintDTO } from "@/types/dto";

interface SprintDialogProps {
  readonly projectId: string;
  readonly sprint: SprintDTO | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function isoDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function defaultRange(): { start: string; end: string } {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 14);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function SprintDialog({
  projectId,
  sprint,
  open,
  onOpenChange,
}: SprintDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = sprint !== null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const payload = {
        name: formData.get("name"),
        goal: formData.get("goal"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      };

      const result = isEditing
        ? await updateSprintAction({ ...payload, sprintId: sprint.id })
        : await createSprintAction({ ...payload, projectId });

      if (!result.success) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFormError(result.error.fieldErrors ? null : result.error.message);
        return;
      }

      toast.success(isEditing ? "Sprint updated." : "Sprint created.");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <SprintForm
          key={sprint?.id ?? (open ? "new" : "closed")}
          sprint={sprint}
          isPending={isPending}
          fieldErrors={fieldErrors}
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface SprintFormProps {
  readonly sprint: SprintDTO | null;
  readonly isPending: boolean;
  readonly fieldErrors: FieldErrors;
  readonly formError: string | null;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly onCancel: () => void;
}

function SprintForm({
  sprint,
  isPending,
  fieldErrors,
  formError,
  onSubmit,
  onCancel,
}: SprintFormProps) {
  const range = defaultRange();
  const isEditing = sprint !== null;

  return (
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit sprint" : "New sprint"}</DialogTitle>
            <DialogDescription>
              Sprints group work into a fixed time box.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Name</Label>
              <Input
                id="sprint-name"
                name="name"
                placeholder="Sprint 1"
                defaultValue={sprint?.name ?? ""}
                required
                disabled={isPending}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={fieldErrors.name ? "sprint-name-error" : undefined}
              />
              {fieldErrors.name ? (
                <p id="sprint-name-error" role="alert" className="text-sm text-destructive">
                  {fieldErrors.name[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Goal</Label>
              <Textarea
                id="sprint-goal"
                name="goal"
                rows={2}
                placeholder="What should this sprint achieve?"
                defaultValue={sprint?.goal ?? ""}
                disabled={isPending}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sprint-start">Start date</Label>
                <Input
                  id="sprint-start"
                  name="startDate"
                  type="date"
                  defaultValue={sprint ? isoDate(sprint.startDate) : range.start}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint-end">End date</Label>
                <Input
                  id="sprint-end"
                  name="endDate"
                  type="date"
                  defaultValue={sprint ? isoDate(sprint.endDate) : range.end}
                  required
                  disabled={isPending}
                  aria-invalid={fieldErrors.endDate ? true : undefined}
                  aria-describedby={fieldErrors.endDate ? "sprint-end-error" : undefined}
                />
                {fieldErrors.endDate ? (
                  <p id="sprint-end-error" role="alert" className="text-sm text-destructive">
                    {fieldErrors.endDate[0]}
                  </p>
                ) : null}
              </div>
            </div>

            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEditing ? "Save sprint" : "Create sprint"}
            </Button>
          </DialogFooter>
        </form>
  );
}
