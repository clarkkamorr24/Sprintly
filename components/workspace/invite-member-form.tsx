"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

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
  const [manualLink, setManualLink] = useState<{
    email: string;
    url: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!manualLink) return;

    try {
      await navigator.clipboard.writeText(manualLink.url);
      setCopied(true);
      toast.success("Invitation link copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Check your browser's clipboard permission.");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setManualLink(null);
    setCopied(false);

    startTransition(async () => {
      const result = await inviteMemberAction({ workspaceId, email, role });

      if (!result.success) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFormError(result.error.fieldErrors ? null : result.error.message);
        return;
      }

      const { invitation, emailSent, invitationUrl } = result.data;

      if (emailSent) {
        toast.success(`Invitation sent to ${invitation.email}.`);
      } else {
        setManualLink({ email: invitation.email, url: invitationUrl });
        toast.warning(`Invitation created, but the email could not be sent.`);
      }

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
      <div className="flex min-w-56 flex-1 flex-col gap-2">
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

      <div className="flex flex-col gap-2">
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

      {manualLink ? (
        <div
          role="status"
          className="flex w-full flex-wrap items-center gap-3 border border-(--sp-neutral-300) bg-(--sp-neutral-100) p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Could not email {manualLink.email}
            </p>
            <p className="text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
              The invitation is saved and still valid. Copy the link and send it
              to them directly.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="shrink-0 gap-1.5"
          >
            <HugeiconsIcon
              icon={copied ? Tick02Icon : Copy01Icon}
              strokeWidth={2}
              className="size-[15px]"
            />
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
