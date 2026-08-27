"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateWorkspaceAction } from "@/app/actions/workspace-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/types/api";

interface WorkspaceGeneralFormProps {
  readonly workspaceId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly canUpdate: boolean;
}

export function WorkspaceGeneralForm({
  workspaceId,
  name,
  slug,
  description,
  canUpdate,
}: WorkspaceGeneralFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await updateWorkspaceAction({
        workspaceId,
        name: formData.get("name"),
        description: formData.get("description"),
      });

      if (!result.success) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFormError(result.error.fieldErrors ? null : result.error.message);
        return;
      }

      toast.success("Workspace updated.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="sp-panel space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input
          id="ws-name"
          name="name"
          defaultValue={name}
          required
          disabled={!canUpdate || isPending}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "ws-name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="ws-name-error" role="alert" className="text-sm text-(--sp-accent-700)">
            {fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws-slug">Workspace slug</Label>
        <Input id="ws-slug" value={slug} readOnly disabled />
        <p className="text-xs text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
          Generated from the workspace name and used in shareable links.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws-description">Description</Label>
        <Textarea
          id="ws-description"
          name="description"
          rows={2}
          defaultValue={description ?? ""}
          disabled={!canUpdate || isPending}
        />
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-(--sp-accent-700)">
          {formError}
        </p>
      ) : null}

      {canUpdate ? (
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      ) : (
        <p className="text-sm text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
          Only owners and admins can change workspace settings.
        </p>
      )}
    </form>
  );
}
