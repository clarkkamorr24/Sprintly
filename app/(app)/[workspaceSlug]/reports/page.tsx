import { redirect } from "next/navigation";

import { NoProjectState } from "@/components/project/no-project-state";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveWorkspaceProjectScope } from "@/lib/auth/workspace-page";
import { loadPage } from "@/lib/page-guard";

export default async function LegacyRedirect(
  props: PageProps<"/[workspaceSlug]/reports">
) {
  const { workspaceSlug } = await props.params;

  const scope = await loadPage(() =>
    resolveWorkspaceProjectScope(workspaceSlug)
  );

  if (scope.project) {
    redirect(
      `/${workspaceSlug}/projects/${scope.project.slug}/reports`
    );
  }

  return (
    <NoProjectState
      workspaceSlug={workspaceSlug}
      feature="Reports"
      canCreate={can(scope.workspace.role, PERMISSIONS.PROJECT_CREATE)}
    />
  );
}
