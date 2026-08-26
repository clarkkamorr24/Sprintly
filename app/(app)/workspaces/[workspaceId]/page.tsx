import type { Metadata } from "next";

import { ProjectList } from "@/components/project/project-list";
import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { listProjects } from "@/services/project-service";
import { getWorkspace } from "@/services/workspace-service";

export async function generateMetadata(
  props: PageProps<"/workspaces/[workspaceId]">
): Promise<Metadata> {
  const { workspaceId } = await props.params;

  try {
    const workspace = await getWorkspace(workspaceId);
    return { title: `${workspace.name} · Sprintly` };
  } catch {
    return { title: "Workspace · Sprintly" };
  }
}

export default async function WorkspacePage(
  props: PageProps<"/workspaces/[workspaceId]">
) {
  const { workspaceId } = await props.params;

  const [context, workspace, projects] = await loadPage(() =>
    Promise.all([
      requireWorkspaceAccess(workspaceId),
      getWorkspace(workspaceId),
      listProjects({ workspaceId }),
    ])
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {workspace.name}
        </h1>
        {workspace.description ? (
          <p className="text-sm text-muted-foreground">{workspace.description}</p>
        ) : null}
      </header>

      <ProjectList
        workspaceId={workspaceId}
        projects={projects}
        canCreate={can(context.role, PERMISSIONS.PROJECT_CREATE)}
      />
    </main>
  );
}
