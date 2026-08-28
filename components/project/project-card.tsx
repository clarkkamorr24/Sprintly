import { OpenProjectLink } from "@/components/project/open-project-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatus } from "@/lib/generated/prisma/enums";
import type { ProjectDTO } from "@/types/dto";

const STATUS_LABEL: Readonly<Record<ProjectStatus, string>> = {
  [ProjectStatus.PLANNING]: "Planning",
  [ProjectStatus.ACTIVE]: "Active",
  [ProjectStatus.COMPLETED]: "Completed",
  [ProjectStatus.ARCHIVED]: "Archived",
};

const STATUS_VARIANT: Readonly<
  Record<ProjectStatus, "default" | "secondary" | "outline">
> = {
  [ProjectStatus.PLANNING]: "outline",
  [ProjectStatus.ACTIVE]: "default",
  [ProjectStatus.COMPLETED]: "secondary",
  [ProjectStatus.ARCHIVED]: "secondary",
};

interface ProjectCardProps {
  readonly project: ProjectDTO;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="relative transition-colors hover:border-ring/40 focus-within:border-ring/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-1 size-3 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">
              <OpenProjectLink
                projectId={project.id}
                workspaceSlug={project.workspaceSlug}
                className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {project.name}
              </OpenProjectLink>
            </CardTitle>
          </div>
          <Badge variant={STATUS_VARIANT[project.status]}>
            {STATUS_LABEL[project.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {project.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        ) : null}

        <dl className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt>Tasks</dt>
            <dd className="font-medium text-foreground">{project.taskCount}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Members</dt>
            <dd className="font-medium text-foreground">{project.memberCount}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
