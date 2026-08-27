"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { inviteMemberAction } from "@/app/actions/invitation-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceRole } from "@/lib/generated/prisma/enums";
import type { FieldErrors } from "@/types/api";

interface InviteMemberFormProps {
  readonly workspaceId: string;
}

const ROLE_ITEMS = [
  { value: WorkspaceRole.MEMBER, label: "Member" },
  { value: WorkspaceRole.ADMIN, label: "Admin" },
];

export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(WorkspaceRole.MEMBER);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await inviteMemberAction({ workspaceId, email, role });

      if (!result.success) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFormError(result.error.fieldErrors ? null : result.error.message);
        return;
      }

      toast.success(`Invitation sent to ${result.data.email}.`);
      setEmail("");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="min-w-56 flex-1 space-y-2">
        <Label htmlFor="invite-email">Invite by email</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="teammate@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "invite-email-error" : undefined}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          items={ROLE_ITEMS}
          value={role}
          onValueChange={(value) => setRole(String(value))}
        >
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending || !email.trim()}>
        {isPending ? "Sending…" : "Send invite"}
      </Button>

      {fieldErrors.email ? (
        <p
          id="invite-email-error"
          role="alert"
          className="w-full text-sm text-destructive"
        >
          {fieldErrors.email[0]}
        </p>
      ) : null}

      {formError ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
