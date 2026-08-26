"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createProjectAction } from "@/app/actions/project-actions";
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
import { PROJECT_COLORS } from "@/lib/constants";
import { ProjectStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/types/api";

interface CreateProjectDialogProps {
  readonly workspaceId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  workspaceId,
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await createProjectAction({
        workspaceId,
        name: formData.get("name"),
        description: formData.get("description"),
        color,
        status: ProjectStatus.PLANNING,
      });

      if (!result.success) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFormError(result.error.fieldErrors ? null : result.error.message);
        return;
      }

      toast.success(`Project "${result.data.name}" created.`);
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              A project gets a Kanban board with default columns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                name="name"
                placeholder="Website Redesign"
                required
                disabled={isPending}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={fieldErrors.name ? "project-name-error" : undefined}
              />
              {fieldErrors.name ? (
                <p id="project-name-error" role="alert" className="text-sm text-destructive">
                  {fieldErrors.name[0]}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                name="description"
                rows={3}
                placeholder="What is this project about?"
                disabled={isPending}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Color</legend>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((value) => {
                  const isSelected = value === color;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Use color ${value}`}
                      aria-pressed={isSelected}
                      disabled={isPending}
                      onClick={() => setColor(value)}
                      className={cn(
                        "size-7 rounded-full outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: value }}
                    />
                  );
                })}
              </div>
            </fieldset>

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
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
