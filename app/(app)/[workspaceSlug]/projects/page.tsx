import type { Metadata } from "next";

import { ProjectList } from "@/components/project/project-list";
import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { listProjects } from "@/services/project-service";

export const metadata: Metadata = {
  title: "Projects · Sprintly",
};

export default async function WorkspaceProjectsPage(
  props: PageProps<"/[workspaceSlug]/projects">
) {
  const { workspaceSlug } = await props.params;

  const { context, projects } = await loadPage(async () => {
    const context = await requireWorkspaceBySlug(workspaceSlug);
    const projects = await listProjects({ workspaceId: context.workspaceId });

    return { context, projects };
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 lg:px-6">
      <header className="space-y-1">
        <h1 className="text-[32px]">Projects</h1>
        <p className="text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
          {projects.length} {projects.length === 1 ? "project" : "projects"} in
          this workspace.
        </p>
      </header>

      <ProjectList
        workspaceId={context.workspaceId}
        projects={projects}
        canCreate={can(context.role, PERMISSIONS.PROJECT_CREATE)}
        canDelete={can(context.role, PERMISSIONS.PROJECT_DELETE)}
      />
    </main>
  );
}
