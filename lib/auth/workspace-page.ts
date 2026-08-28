import "server-only";

import {
  requireWorkspaceProject,
  type ActiveProject,
} from "@/lib/auth/active-project";
import { requireProjectAccess, requireWorkspaceBySlug } from "@/lib/auth/guards";
import type { ProjectContext, WorkspaceContext } from "@/types/auth";

export interface WorkspaceProjectScope {
  readonly workspace: WorkspaceContext;
  readonly project: ActiveProject;
  readonly context: ProjectContext;
}

export async function resolveWorkspaceProjectScope(
  slug: string
): Promise<WorkspaceProjectScope> {
  const workspace = await requireWorkspaceBySlug(slug);
  const project = await requireWorkspaceProject(workspace.workspaceId);
  const context = await requireProjectAccess(project.id);

  return { workspace, project, context };
}
