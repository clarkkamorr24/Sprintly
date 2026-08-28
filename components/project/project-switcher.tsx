"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { selectProjectAction } from "@/app/actions/project-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [isPending, startTransition] = useTransition();

  const active = projects.find((project) => project.id === activeProjectId);

  if (projects.length <= 1) {
    return (
      <p className="sp-kicker">{active?.key ?? "Project"}</p>
    );
  }

  const select = (projectId: string) => {
    startTransition(async () => {
      const result = await selectProjectAction({ projectId });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={isPending}
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
              onClick={() => select(project.id)}
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
