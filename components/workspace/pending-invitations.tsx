"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { revokeInvitationAction } from "@/app/actions/invitation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { InvitationDTO } from "@/types/dto";

interface PendingInvitationsProps {
  readonly invitations: readonly InvitationDTO[];
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const revoke = (invitation: InvitationDTO) => {
    startTransition(async () => {
      const result = await revokeInvitationAction({
        invitationId: invitation.id,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(`Revoked the invite for ${invitation.email}.`);
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="invitations-heading" className="space-y-3">
      <h2 id="invitations-heading" className="text-sm font-semibold">
        Pending invitations
      </h2>

      {invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pending invitations.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {invitation.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invited by {invitation.invitedBy.name} ·{" "}
                  {formatRelativeTime(invitation.createdAt)} · expires{" "}
                  {formatRelativeTime(invitation.expiresAt)}
                </p>
              </div>

              <Badge variant="outline">{invitation.role}</Badge>

              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => revoke(invitation)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
