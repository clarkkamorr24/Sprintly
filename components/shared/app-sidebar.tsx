"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { useMobileNav } from "@/components/shared/mobile-nav-context";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { WorkspaceDTO } from "@/types/dto";

interface NavItem {
  readonly label: string;
  readonly segment: string;
  readonly icon: React.ReactNode;
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
  readonly activeWorkspaceSlug: string;
  readonly activeProject: { readonly id: string; readonly name: string; readonly key: string } | null;
}

const WORKSPACE_NAV: readonly NavItem[] = [
  {
    label: "Overview",
    segment: "",
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
    label: "Projects",
    segment: "projects",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <path d="M3 9h18" />
      </svg>
    ),
  },
  {
    label: "Team",
    segment: "team",
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
    segment: "settings",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M4.5 7.5l2.6 1.5M16.9 15l2.6 1.5M4.5 16.5l2.6-1.5M16.9 9l2.6-1.5" />
      </svg>
    ),
  },
];

const WORK_NAV: readonly NavItem[] = [
  {
    label: "Board",
    segment: "board",
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
    segment: "backlog",
    icon: (
      <svg {...iconProps}>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    label: "Sprints",
    segment: "sprints",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.5" />
      </svg>
    ),
  },
  {
    label: "Issues",
    segment: "issues",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v4.5M12 16h.01" />
      </svg>
    ),
  },
  {
    label: "Reports",
    segment: "reports",
    icon: (
      <svg {...iconProps}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
];

export function AppSidebar({
  workspaces,
  activeWorkspaceId,
  activeWorkspaceSlug,
  activeProject,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { isOpen: isMobileOpen, setOpen: setMobileOpen } = useMobileNav();
  const [isCreateOpen, setCreateOpen] = useState(false);

  const routeSlug = /^\/workspaces\/([^/]+)/.exec(pathname)?.[1];
  const currentSlug = routeSlug ?? activeWorkspaceSlug;

  const currentWorkspace =
    workspaces.find((w) => w.slug === currentSlug) ??
    workspaces.find((w) => w.id === activeWorkspaceId);

  const hasProjects = currentWorkspace
    ? currentWorkspace.projectCount > 0
    : activeProject !== null;

  const hrefFor = (segment: string) =>
    segment ? `/workspaces/${currentSlug}/${segment}` : `/workspaces/${currentSlug}`;

  const isCurrent = (segment: string) => pathname === hrefFor(segment);

  const renderNav = (items: readonly NavItem[]) =>
    items.map((item) => (
      <Link
        key={item.label}
        href={hrefFor(item.segment)}
        aria-current={isCurrent(item.segment) ? "page" : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 px-2.5 py-[7px] text-[13px] outline-none transition-colors",
          "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          isCurrent(item.segment) &&
            "bg-(--sp-neutral-900) text-(--sp-bg) hover:bg-(--sp-neutral-900)"
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    ));

  const brand = (
    <div className="border-b border-(--sp-neutral-300) px-4 py-[14px]">
      <Link
        href="/"
        className="flex items-center gap-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span aria-hidden className="block size-5 bg-(--sp-accent)" />
        <span className="text-[18px] font-extrabold tracking-[-0.02em]">Sprintly</span>
      </Link>
    </div>
  );

  const nav = currentSlug ? (
    <nav className="flex flex-col gap-px p-2">
      <div className="sp-kicker px-2.5 pt-1.5 pb-1 text-[10px] tracking-[0.1em]">
        Workspace
      </div>
      {renderNav(WORKSPACE_NAV)}

      {hasProjects ? (
        <>
          <div className="sp-kicker mt-2 px-2.5 pt-1.5 pb-1 text-[10px] tracking-[0.1em]">
            Work
          </div>
          {renderNav(WORK_NAV)}
        </>
      ) : null}
    </nav>
  ) : null;

  const switcher = (
    <WorkspaceSwitcher
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      activeProject={activeProject}
      onCreate={() => setCreateOpen(true)}
    />
  );

  return (
    <>
      <aside className="hidden w-[236px] shrink-0 flex-col border-r border-(--sp-neutral-300) bg-(--sp-neutral-100) lg:flex">
        {brand}
        {switcher}
        {nav}
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="lg:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {brand}
          {switcher}
          {nav}
        </SheetContent>
      </Sheet>

      <CreateWorkspaceDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
