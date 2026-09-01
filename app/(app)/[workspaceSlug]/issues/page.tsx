import { redirect } from "next/navigation";

import { NoProjectState } from "@/components/project/no-project-state";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveWorkspaceProjectScope } from "@/lib/auth/workspace-page";
import { loadPage } from "@/lib/page-guard";

/**
 * The project pages moved under /projects/<projectSlug>/. This keeps the older
 * links working by sending them to the workspace's selected project.
 */
export default async function LegacyRedirect(
  props: PageProps<"/[workspaceSlug]/issues">
) {
  const { workspaceSlug } = await props.params;

  const scope = await loadPage(() =>
    resolveWorkspaceProjectScope(workspaceSlug)
  );

  if (scope.project) {
    redirect(
      `/${workspaceSlug}/projects/${scope.project.slug}/issues`
    );
  }

  return (
    <NoProjectState
      workspaceSlug={workspaceSlug}
      feature="Issues"
      canCreate={can(scope.workspace.role, PERMISSIONS.PROJECT_CREATE)}
    />
  );
}
