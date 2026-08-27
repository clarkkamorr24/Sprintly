"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Add01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsOf } from "@/lib/initials";
import type { WorkspaceDTO } from "@/types/dto";

interface WorkspaceSwitcherProps {
  readonly workspaces: readonly WorkspaceDTO[];
  readonly activeWorkspaceId: string;
  readonly activeProject: { readonly id: string; readonly name: string; readonly key: string } | null;
  readonly onCreate: () => void;
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  activeProject,
  onCreate,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const active = workspaces.find((w) => w.id === activeWorkspaceId);
  const name = active?.name ?? "Select workspace";

  const subtitle = activeProject
    ? `${activeProject.name} · ${activeProject.key}`
    : active
      ? `${active.projectCount} ${active.projectCount === 1 ? "project" : "projects"}`
      : "No workspace selected";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Workspace: ${name}. Switch workspace`}
            className="flex w-full items-center gap-2.5 border-0 border-b border-(--sp-neutral-300) bg-transparent px-4 py-3 text-left outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--sp-text)_5%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex size-[26px] shrink-0 items-center justify-center bg-(--sp-neutral-800) text-[11px] font-extrabold text-(--sp-bg)">
              {initialsOf(name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-[1.2]">
                {name}
              </span>
              <span className="block truncate text-[11px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
                {subtitle}
              </span>
            </span>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
          </button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => router.push(`/workspaces/${workspace.id}`)}
            >
              <span className="flex-1 truncate">{workspace.name}</span>
              {workspace.id === activeWorkspaceId ? (
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {activeWorkspaceId ? (
            <DropdownMenuItem
              onClick={() => router.push(`/workspaces/${activeWorkspaceId}/members`)}
            >
              Members
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={onCreate}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
