import "server-only";

import {
  resolveWorkspaceProject,
  type ActiveProject,
} from "@/lib/auth/active-project";
import { requireProjectAccess, requireWorkspaceBySlug } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import * as projectRepo from "@/repositories/project-repository";
import type { ProjectContext, WorkspaceContext } from "@/types/auth";

export interface WorkspaceProjectScope {
  readonly workspace: WorkspaceContext;
  readonly project: ActiveProject | null;
  readonly context: ProjectContext | null;
}

export async function resolveWorkspaceProjectScope(
  slug: string
): Promise<WorkspaceProjectScope> {
  const workspace = await requireWorkspaceBySlug(slug);
  const project = await resolveWorkspaceProject(workspace.workspaceId);

  if (!project) return { workspace, project: null, context: null };

  const context = await requireProjectAccess(project.id);

  return { workspace, project, context };
}

export async function resolveProjectBySlug(
  workspaceSlug: string,
  projectSlug: string
): Promise<WorkspaceProjectScope> {
  const workspace = await requireWorkspaceBySlug(workspaceSlug);
  const project = await projectRepo.findProjectBySlug(
    workspace.workspaceId,
    projectSlug
  );

  if (!project) throw new NotFoundError("Project not found.");

  const context = await requireProjectAccess(project.id);

  return { workspace, project, context };
}
