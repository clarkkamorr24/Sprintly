"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import type { SessionUser } from "@/types/auth";
import type { WorkspaceDTO } from "@/types/dto";

interface AppHeaderProps {
  readonly user: SessionUser;
  readonly workspaces: readonly WorkspaceDTO[];
  readonly unreadCount: number;
}

export function AppHeader({ user, workspaces, unreadCount }: AppHeaderProps) {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const params = useParams<{ workspaceId?: string }>();

  const activeWorkspaceId = params.workspaceId ?? workspaces[0]?.id ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link
            href="/"
            className="font-semibold tracking-tight rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Sprintly
          </Link>

          <span aria-hidden className="text-muted-foreground">
            /
          </span>

          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onCreate={() => setCreateOpen(true)}
          />

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell initialUnreadCount={unreadCount} />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <CreateWorkspaceDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
