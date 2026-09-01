import type { Metadata } from "next";

import { BacklogView } from "@/components/backlog/backlog-view";
import { NoProjectState } from "@/components/project/no-project-state";
import { ProjectSwitcher } from "@/components/project/project-switcher";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveProjectBySlug } from "@/lib/auth/workspace-page";
import { loadPage } from "@/lib/page-guard";
import { getBacklog, getBoard, getBoardMeta } from "@/services/board-service";
import { listProjects } from "@/services/project-service";

export const metadata: Metadata = {
  title: "Backlog · Sprintly",
};

export default async function WorkspaceBacklogPage(
  props: PageProps<"/[workspaceSlug]/projects/[projectSlug]/backlog">
) {
  const { workspaceSlug, projectSlug } = await props.params;

  const scoped = await loadPage(async () => {
    const scope = await resolveProjectBySlug(workspaceSlug, projectSlug);

    if (!scope.project || !scope.context) {
      return { empty: true as const, workspace: scope.workspace };
    }

    const [groups, board, meta, projects] = await Promise.all([
      getBacklog(scope.project.id),
      getBoard(scope.project.id),
      getBoardMeta(scope.project.id),
      listProjects({ workspaceId: scope.workspace.workspaceId }),
    ]);

    return {
      empty: false as const,
      context: scope.context,
      project: scope.project,
      groups,
      board,
      meta,
      projects,
    };
  });

  if (scoped.empty) {
    return (
      <NoProjectState
        workspaceSlug={workspaceSlug}
        feature="The backlog"
        canCreate={can(scoped.workspace.role, PERMISSIONS.PROJECT_CREATE)}
      />
    );
  }

  const { context, project, groups, board, meta, projects } = scoped;

  const columnNames = new Map(
    board.columns.map((column) => [column.id, column.name])
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 lg:px-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5">
            <ProjectSwitcher
              projects={projects}
              activeProjectId={project.id}
            />
          </div>
          <h1 className="text-[32px]">Backlog</h1>
        </div>
      </header>

      <BacklogView
        projectId={project.id}
        groups={groups}
        columnNames={Object.fromEntries(columnNames)}
        members={meta.members}
        canManageSprints={can(context.role, PERMISSIONS.BOARD_MANAGE)}
        canCreateTask={can(context.role, PERMISSIONS.TASK_CREATE)}
        canComment={can(context.role, PERMISSIONS.COMMENT_CREATE)}
        defaultColumnId={board.columns[0]?.id ?? ""}
      />
    </main>
  );
}
