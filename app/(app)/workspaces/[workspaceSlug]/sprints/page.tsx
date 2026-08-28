import type { Metadata } from "next";

import { ProjectSwitcher } from "@/components/project/project-switcher";
import { SprintPlanning } from "@/components/sprint/sprint-planning";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveWorkspaceProjectScope } from "@/lib/auth/workspace-page";
import { loadPage } from "@/lib/page-guard";
import { getBacklog } from "@/services/board-service";
import { listProjects } from "@/services/project-service";
import { listSprints } from "@/services/sprint-service";

export const metadata: Metadata = {
  title: "Sprints · Sprintly",
};

export default async function WorkspaceSprintsPage(
  props: PageProps<"/workspaces/[workspaceSlug]/sprints">
) {
  const { workspaceSlug } = await props.params;

  const { context, project, sprints, groups, projects } = await loadPage(
    async () => {
      const scope = await resolveWorkspaceProjectScope(workspaceSlug);

      const [sprints, groups, projects] = await Promise.all([
        listSprints(scope.project.id),
        getBacklog(scope.project.id),
        listProjects({ workspaceId: scope.workspace.workspaceId }),
      ]);

      return {
        context: scope.context,
        project: scope.project,
        sprints,
        groups,
        projects,
      };
    }
  );

  const unassigned = groups.find((group) => group.sprint === null);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-(--sp-neutral-300) px-4 pt-5 pb-4 lg:px-6">
        <div className="mb-1.5">
          <ProjectSwitcher projects={projects} activeProjectId={project.id} />
        </div>
        <h1 className="text-[32px]">Sprint planning</h1>
      </div>

      <SprintPlanning
        projectId={project.id}
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
