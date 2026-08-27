"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteWorkspaceAction,
  transferOwnershipAction,
} from "@/app/actions/workspace-actions";
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

interface DangerZoneProps {
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly transferTargets: readonly { id: string; name: string }[];
}

export function DangerZone({
  workspaceId,
  workspaceName,
  transferTargets,
}: DangerZoneProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmName, setConfirmName] = useState("");
  const [transferTo, setTransferTo] = useState<string>(
    transferTargets[0]?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  const transfer = () => {
    if (!transferTo) return;
    setError(null);

    startTransition(async () => {
      const result = await transferOwnershipAction({
        workspaceId,
        toUserId: transferTo,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      toast.success("Ownership transferred. You are now an admin.");
      router.refresh();
    });
  };

  const remove = () => {
    setError(null);

    startTransition(async () => {
      const result = await deleteWorkspaceAction({ workspaceId, confirmName });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      toast.success("Workspace deleted.");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 border border-(--sp-accent-300) bg-(--sp-accent-100) p-4">
      {transferTargets.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="transfer-to">Transfer ownership</Label>
          <p className="text-xs text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
            The new owner gains full control. You become an admin.
          </p>
          <div className="flex flex-wrap gap-2">
            <Select
              items={transferTargets.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
              value={transferTo}
              onValueChange={(value) => setTransferTo(String(value))}
            >
              <SelectTrigger id="transfer-to" className="min-w-52 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transferTargets.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    {target.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={transfer}
              disabled={isPending || !transferTo}
            >
              Transfer
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2 border-t border-(--sp-accent-300) pt-4">
        <Label htmlFor="confirm-name">Delete this workspace</Label>
        <p className="text-xs text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
          Permanently removes every project, sprint, issue and comment. Type{" "}
          <strong>{workspaceName}</strong> to confirm.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            id="confirm-name"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            placeholder={workspaceName}
            className="min-w-52 flex-1"
            disabled={isPending}
          />
          <Button
            variant="destructive"
            onClick={remove}
            disabled={isPending || confirmName !== workspaceName}
          >
            {isPending ? "Deleting…" : "Delete workspace"}
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-(--sp-accent-700)">
          {error}
        </p>
      ) : null}
    </div>
  );
}
