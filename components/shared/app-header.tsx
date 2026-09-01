"use client";

import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Menu01Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { useMobileNav } from "@/components/shared/mobile-nav-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { Button } from "@/components/ui/button";
import { initialsOf } from "@/lib/initials";
import type { SessionUser } from "@/types/auth";
import type { WorkspaceDTO } from "@/types/dto";
import { SprintlyMark } from "@/components/shared/sprintly-mark";

interface AppHeaderProps {
  readonly user: SessionUser;
  readonly workspaces: readonly WorkspaceDTO[];
  readonly activeWorkspaceId: string;
  readonly unreadCount: number;
}

export function AppHeader({
  user,
  workspaces,
  activeWorkspaceId,
  unreadCount,
}: AppHeaderProps) {
  const { open: openMobileNav } = useMobileNav();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-(--sp-neutral-300) px-4 lg:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:hidden"
        >
          <SprintlyMark size={20} />
          <span className="text-[16px] font-extrabold tracking-[-0.02em]">Sprintly</span>
        </Link>

        <div className="hidden max-w-[420px] flex-1 items-center gap-2 border border-(--sp-neutral-300) bg-(--sp-neutral-100) px-2.5 py-1.5 md:flex">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="size-[15px] opacity-55"
          />
          <span className="flex-1 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_62%,transparent)]">
            Search issues, projects, people
          </span>
          <span className="border border-(--sp-neutral-300) px-[5px] py-px text-[11px] font-extrabold">
            ⌘K
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="size-[15px]" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          <NotificationBell
            initialUnreadCount={unreadCount}
            currentUserId={user.id}
          />

          <div className="flex items-center gap-2.5 border-l border-(--sp-neutral-300) pl-3.5">
            <span className="hidden leading-[1.15] sm:block">
              <span className="block text-[12px] font-semibold">{user.name}</span>
              <span className="block text-[10px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
                {user.email}
              </span>
            </span>
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-(--sp-neutral-300) bg-(--sp-neutral-100) px-2 py-1.5 lg:hidden">
        <button
          type="button"
          onClick={openMobileNav}
          aria-label="Open navigation menu"
          className="flex size-9 shrink-0 items-center justify-center outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-[18px]" />
        </button>
        <span className="flex size-[22px] shrink-0 items-center justify-center bg-(--sp-neutral-800) text-[10px] font-extrabold text-(--sp-bg)">
          {initialsOf(active?.name ?? "?")}
        </span>
        <span className="truncate text-[12px] font-semibold">
          {active?.name ?? "No workspace"}
        </span>
      </div>

      <CreateWorkspaceDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
