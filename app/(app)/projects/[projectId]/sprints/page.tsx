import type { Metadata } from "next";
import Link from "next/link";

import { SprintPlanning } from "@/components/sprint/sprint-planning";
import { requireProjectAccess } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { getBacklog } from "@/services/board-service";
import { getProject } from "@/services/project-service";
import { listSprints } from "@/services/sprint-service";

export async function generateMetadata(
  props: PageProps<"/projects/[projectId]/sprints">
): Promise<Metadata> {
  const { projectId } = await props.params;

  try {
    const project = await getProject(projectId);
    return { title: `Sprints · ${project.name} · Sprintly` };
  } catch {
    return { title: "Sprints · Sprintly" };
  }
}

export default async function SprintsPage(
  props: PageProps<"/projects/[projectId]/sprints">
) {
  const { projectId } = await props.params;

  const [context, project, sprints, groups] = await loadPage(() =>
    Promise.all([
      requireProjectAccess(projectId),
      getProject(projectId),
      listSprints(projectId),
      getBacklog(projectId),
    ])
  );

  const unassigned = groups.find((group) => group.sprint === null);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-(--sp-neutral-300) px-4 pt-5 pb-4 lg:px-6">
        <nav aria-label="Breadcrumb" className="sp-kicker mb-1.5">
          <Link
            href={`/projects/${projectId}`}
            className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {project.name}
          </Link>{" "}
          / Sprints
        </nav>
        <h1 className="text-[32px]">Sprint planning</h1>
      </div>

      <SprintPlanning
        projectId={projectId}
        sprints={sprints}
        backlogTasks={unassigned?.tasks ?? []}
        groups={groups}
        canManage={can(context.role, PERMISSIONS.BOARD_MANAGE)}
        canAssign={can(context.role, PERMISSIONS.TASK_UPDATE)}
        canComment={can(context.role, PERMISSIONS.COMMENT_CREATE)}
      />
    </main>
  );
}
