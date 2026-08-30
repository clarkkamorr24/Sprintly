"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/app/actions/workspace-actions";
import { InitialsTile } from "@/components/shared/initials-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceRole } from "@/lib/generated/prisma/enums";
import type { WorkspaceMemberDTO } from "@/types/dto";
import { RelativeTime } from "@/components/shared/relative-time";

const ASSIGNABLE = [
  { value: WorkspaceRole.ADMIN, label: "Admin" },
  { value: WorkspaceRole.MEMBER, label: "Member" },
  { value: WorkspaceRole.VIEWER, label: "Viewer" },
];

interface MemberRowProps {
  readonly workspaceId: string;
  readonly member: WorkspaceMemberDTO;
  readonly currentUserId: string;
  readonly canManageRoles: boolean;
  readonly canRemove: boolean;
}

export function MemberRow({
  workspaceId,
  member,
  currentUserId,
  canManageRoles,
  canRemove,
}: MemberRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isOwner = member.role === WorkspaceRole.OWNER;
  const isSelf = member.user.id === currentUserId;
  const editable = canManageRoles && !isOwner && !isSelf;
  const removable = canRemove && !isOwner && !isSelf;

  const changeRole = (role: string) => {
    startTransition(async () => {
      const result = await updateMemberRoleAction({
        workspaceId,
        userId: member.user.id,
        role,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(`${member.user.name} is now a ${role.toLowerCase()}.`);
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeMemberAction({
        workspaceId,
        userId: member.user.id,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(`Removed ${member.user.name}.`);
      router.refresh();
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <InitialsTile user={member.user} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {member.user.name}
          {isSelf ? (
            <span className="ml-2 text-xs text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
              you
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
          {member.user.email} · joined <RelativeTime iso={member.joinedAt} />
        </p>
      </div>

      {editable ? (
        <Select
          items={ASSIGNABLE}
          value={member.role}
          onValueChange={(value) => changeRole(String(value))}
        >
          <SelectTrigger
            size="sm"
            aria-label={`Role for ${member.user.name}`}
            disabled={isPending}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge variant="outline">{member.role}</Badge>
      )}

      {removable ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={isPending}
          className="text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)] hover:text-(--sp-accent-700)"
        >
          Remove
        </Button>
      ) : null}
    </li>
  );
}
