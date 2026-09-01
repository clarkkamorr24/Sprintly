"use client";

import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseRoute, projectPath } from "@/lib/routes";
import type { ProjectDTO } from "@/types/dto";

interface ProjectSwitcherProps {
  readonly projects: readonly ProjectDTO[];
  readonly activeProjectId: string;
}

export function ProjectSwitcher({
  projects,
  activeProjectId,
}: ProjectSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const active = projects.find((project) => project.id === activeProjectId);

  if (projects.length <= 1) {
    return (
      <p className="sp-kicker">{active?.key ?? "Project"}</p>
    );
  }

  const route = parseRoute(pathname);
  const workspaceSlug = route.workspaceSlug ?? active?.workspaceSlug ?? "";
  const section = route.section ?? "board";

  const select = (projectSlug: string) => {
    router.push(projectPath(workspaceSlug, projectSlug, section));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Project: ${active?.name ?? "none"}. Switch project`}
            className="sp-kicker inline-flex items-center gap-1.5 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {active?.key ?? "Project"}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => select(project.slug)}
            >
              <span className="flex-1 truncate">
                {project.name}
                <span className="sp-mono-key ml-2 text-[11px] opacity-60">
                  {project.key}
                </span>
              </span>
              {project.id === activeProjectId ? (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
