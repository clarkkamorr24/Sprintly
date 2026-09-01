import type { Metadata } from "next";

import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { ProjectList } from "@/components/project/project-list";
import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { getDashboard } from "@/services/dashboard-service";
import { listProjects } from "@/services/project-service";
import { getWorkspace } from "@/services/workspace-service";

export async function generateMetadata(
  props: PageProps<"/[workspaceSlug]">
): Promise<Metadata> {
  const { workspaceSlug } = await props.params;

  try {
    const { workspaceId } = await requireWorkspaceBySlug(workspaceSlug);
    const workspace = await getWorkspace(workspaceId);
    return { title: `${workspace.name} · Sprintly` };
  } catch {
    return { title: "Workspace · Sprintly" };
  }
}

export default async function WorkspacePage(
  props: PageProps<"/[workspaceSlug]">
) {
  const { workspaceSlug } = await props.params;

  const { context, workspace, projects, dashboard } = await loadPage(
    async () => {
      const context = await requireWorkspaceBySlug(workspaceSlug);
      const { workspaceId } = context;

      const [workspace, projects, dashboard] = await Promise.all([
        getWorkspace(workspaceId),
        listProjects({ workspaceId }),
        getDashboard(workspaceId),
      ]);

      return { context, workspace, projects, dashboard };
    }
  );

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {workspace.name}
        </h1>
        {workspace.description ? (
          <p className="text-sm text-muted-foreground">{workspace.description}</p>
        ) : null}
      </header>

      <WorkspaceDashboard dashboard={dashboard} workspaceSlug={workspaceSlug} />

      <ProjectList
        workspaceId={context.workspaceId}
        projects={projects}
        canCreate={can(context.role, PERMISSIONS.PROJECT_CREATE)}
        canDelete={can(context.role, PERMISSIONS.PROJECT_DELETE)}
      />
    </main>
  );
}
