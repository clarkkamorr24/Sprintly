"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { cn } from "@/lib/utils";
import type { WorkspaceDTO } from "@/types/dto";

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly badge?: number;
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
} as const;

interface AppSidebarProps {
  readonly workspaces: readonly WorkspaceDTO[];
  readonly activeWorkspaceId: string;
  readonly activeProject: { readonly id: string; readonly name: string; readonly key: string } | null;
}

export function AppSidebar({
  workspaces,
  activeWorkspaceId,
  activeProject,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isCreateOpen, setCreateOpen] = useState(false);

  const workspaceHref = activeWorkspaceId ? `/workspaces/${activeWorkspaceId}` : "/";
  const projectHref = activeProject ? `/projects/${activeProject.id}` : workspaceHref;

  const workspaceNav: readonly NavItem[] = [
    {
      label: "Overview",
      href: workspaceHref,
      icon: (
        <svg {...iconProps}>
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
    },
    {
      label: "Team",
      href: activeWorkspaceId ? `/workspaces/${activeWorkspaceId}/members` : "/",
      icon: (
        <svg {...iconProps}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 6.5a3.5 3.5 0 0 1 0 7M18 20c0-2.2-.8-4.2-2-5.5" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: activeWorkspaceId ? `/workspaces/${activeWorkspaceId}/settings` : "/",
      icon: (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M4.5 7.5l2.6 1.5M16.9 15l2.6 1.5M4.5 16.5l2.6-1.5M16.9 9l2.6-1.5" />
        </svg>
      ),
    },
  ];

  const projectNav: readonly NavItem[] = activeProject
    ? [
        {
          label: "Board",
          href: projectHref,
          icon: (
            <svg {...iconProps}>
              <rect x="3" y="4" width="5" height="16" />
              <rect x="10" y="4" width="5" height="11" />
              <rect x="17" y="4" width="4" height="7" />
            </svg>
          ),
        },
        {
          label: "Backlog",
          href: `${projectHref}/backlog`,
          icon: (
            <svg {...iconProps}>
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          ),
        },
        {
          label: "Sprints",
          href: `${projectHref}/sprints`,
          icon: (
            <svg {...iconProps}>
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          ),
        },
      ]
    : [];

  const isCurrent = (href: string) =>
    href === pathname || (href !== "/" && pathname === href);

  const renderNav = (items: readonly NavItem[]) =>
    items.map((item) => (
      <Link
        key={item.label}
        href={item.href}
        aria-current={isCurrent(item.href) ? "page" : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 px-2.5 py-[7px] text-[13px] outline-none transition-colors",
          "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          isCurrent(item.href) &&
            "bg-(--sp-neutral-900) text-(--sp-bg) hover:bg-(--sp-neutral-900)"
        )}
      >
        {item.icon}
        {item.label}
        {item.badge ? (
          <span className="ml-auto bg-(--sp-accent) px-[5px] py-px text-[10px] font-extrabold text-(--sp-bg)">
            {item.badge}
          </span>
        ) : null}
      </Link>
    ));

  return (
    <>
      <aside className="hidden w-[236px] shrink-0 flex-col border-r border-(--sp-neutral-300) bg-(--sp-neutral-100) lg:flex">
        <div className="border-b border-(--sp-neutral-300) px-4 py-[14px]">
          <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span aria-hidden className="block size-5 bg-(--sp-accent)" />
            <span className="text-[18px] font-extrabold tracking-[-0.02em]">Sprintly</span>
          </Link>
        </div>

        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          activeProject={activeProject}
          onCreate={() => setCreateOpen(true)}
        />

        <nav className="flex flex-col gap-px p-2">
          <div className="sp-kicker px-2.5 pt-1.5 pb-1 text-[10px] tracking-[0.1em]">
            Workspace
          </div>
          {renderNav(workspaceNav)}

          {projectNav.length > 0 ? (
            <>
              <div className="sp-kicker mt-2 px-2.5 pt-1.5 pb-1 text-[10px] tracking-[0.1em]">
                {activeProject?.key ?? "Project"}
              </div>
              {renderNav(projectNav)}
            </>
          ) : null}
        </nav>
      </aside>

      <CreateWorkspaceDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
