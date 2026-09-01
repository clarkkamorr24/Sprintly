"use client";

import { usePathname, useRouter } from "next/navigation";
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
import { parseRoute, workspacePath } from "@/lib/routes";
import type { WorkspaceDTO } from "@/types/dto";

interface WorkspaceSwitcherProps {
  readonly workspaces: readonly WorkspaceDTO[];
  readonly activeWorkspaceId: string;
  readonly onCreate: () => void;
}

const PORTABLE_SECTIONS = ["projects", "team", "reports", "settings"] as const;

/**
 * Project-scoped sections are not portable: the project slug belongs to the
 * workspace being left. Switching from one of those lands on the new
 * workspace's overview so no project stays selected across the switch.
 */
function targetPath(pathname: string, slug: string): string {
  const { projectSlug, section } = parseRoute(pathname);

  if (projectSlug || !section) return workspacePath(slug);

  return (PORTABLE_SECTIONS as readonly string[]).includes(section)
    ? workspacePath(slug, section)
    : workspacePath(slug);
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onCreate,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const routeSlug = parseRoute(pathname).workspaceSlug;
  const active =
    workspaces.find((w) => w.slug === routeSlug) ??
    workspaces.find((w) => w.id === activeWorkspaceId);
  const name = active?.name ?? "Select workspace";

  const subtitle = active
    ? `${active.projectCount} ${active.projectCount === 1 ? "project" : "projects"}`
    : "No workspace selected";

  const switchTo = (slug: string) => {
    router.push(targetPath(pathname, slug));

    if (slug !== routeSlug) router.refresh();
  };

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
              onClick={() => switchTo(workspace.slug)}
            >
              <span className="flex-1 truncate">{workspace.name}</span>
              {workspace.id === active?.id ? (
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {active ? (
            <DropdownMenuItem
              onClick={() => router.push(`/${active.slug}/team`)}
            >
              Team
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
