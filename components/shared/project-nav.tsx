"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { parseRoute, projectPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { ProjectDTO } from "@/types/dto";

interface ProjectNavItem {
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

const WORK_NAV: readonly ProjectNavItem[] = [
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

interface ProjectNavProps {
  readonly workspaceSlug: string;
  readonly projects: readonly ProjectDTO[];
}

export function ProjectNav({ workspaceSlug, projects }: ProjectNavProps) {
  const pathname = usePathname();
  const selectedProjectSlug = parseRoute(pathname).projectSlug;

  const selected = projects.filter(
    (project) => project.slug === selectedProjectSlug
  );

  return (
    <>
      <div className="sp-kicker mt-2 px-2.5 pt-1.5 pb-1 text-[10px] tracking-[0.1em]">
        Project
      </div>

      {selected.length === 0 ? (
        <p className="px-2.5 py-1 text-[12px] text-(--sp-neutral-600)">
          {projects.length === 0
            ? "No projects in this workspace yet."
            : "No project selected."}
        </p>
      ) : (
        selected.map((project) => {
          const isSelected = true;

          return (
            <div key={project.id} className="flex flex-col gap-px">
              <Link
                href={projectPath(workspaceSlug, project.slug, "board")}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-[7px] text-[13px] outline-none transition-colors",
                  "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isSelected &&
                    "bg-(--sp-neutral-900) text-(--sp-bg) hover:bg-(--sp-neutral-900)"
                )}
              >
                <span
                  className={cn(
                    "sp-mono-key shrink-0 text-[10px]",
                    !isSelected && "text-(--sp-neutral-600)"
                  )}
                >
                  {project.key}
                </span>
                <span className="truncate">{project.name}</span>
              </Link>

              {isSelected ? (
                <div className="ml-[13px] flex flex-col gap-px border-l border-(--sp-neutral-300) pl-2">
                  {WORK_NAV.map((item) => {
                    const href = projectPath(
                      workspaceSlug,
                      project.slug,
                      item.segment
                    );
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={item.label}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-2.5 py-[6px] text-[13px] outline-none transition-colors",
                          "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]",
                          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          isActive
                            ? "font-medium text-(--sp-text)"
                            : "text-(--sp-neutral-600)"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </>
  );
}
