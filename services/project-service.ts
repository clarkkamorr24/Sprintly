import "server-only";

import {
  requireProjectAccess,
  requireProjectPermission,
  requireWorkspaceAccess,
  requireWorkspacePermission,
} from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/errors";
import * as repo from "@/repositories/project-repository";
import type {
  CreateProjectInput,
  DeleteProjectInput,
  ListProjectsInput,
  UpdateProjectInput,
} from "@/schemas/project";
import type { ProjectDTO } from "@/types/dto";

function toProjectDTO(project: repo.ProjectRecord): ProjectDTO {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    workspaceSlug: project.workspace.slug,
    name: project.name,
    key: project.key,
    description: project.description,
    color: project.color,
    status: project.status,
    createdBy: project.createdBy,
    memberCount: project._count.members,
    taskCount: project._count.tasks,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function listProjects(
  input: ListProjectsInput
): Promise<readonly ProjectDTO[]> {
  await requireWorkspaceAccess(input.workspaceId);

  const projects = await repo.findProjectsForWorkspace({
    workspaceId: input.workspaceId,
    status: input.status,
    search: input.search,
  });

  return projects.map(toProjectDTO);
}

export async function getProject(projectId: string): Promise<ProjectDTO> {
  await requireProjectAccess(projectId);

  const project = await repo.findProjectById(projectId);
  if (!project) throw new NotFoundError("Project not found.");

  return toProjectDTO(project);
}

export async function createProject(
  input: CreateProjectInput
): Promise<ProjectDTO> {
  const context = await requireWorkspacePermission(
    input.workspaceId,
    PERMISSIONS.PROJECT_CREATE
  );

  const project = await repo.createProjectWithBoard({
    workspaceId: input.workspaceId,
    key: await repo.nextProjectKey(input.workspaceId, input.name),
    name: input.name,
    description: input.description?.trim() || null,
    color: input.color,
    status: input.status,
    createdById: context.user.id,
    memberIds: [context.user.id],
  });

  return toProjectDTO(project);
}

export async function updateProject(
  input: UpdateProjectInput
): Promise<ProjectDTO> {
  await requireProjectPermission(input.projectId, PERMISSIONS.PROJECT_UPDATE);

  const project = await repo.updateProject(input.projectId, {
    name: input.name,
    description: input.description?.trim() || null,
    color: input.color,
    status: input.status,
  });

  return toProjectDTO(project);
}

export async function deleteProject(input: DeleteProjectInput): Promise<void> {
  await requireProjectPermission(input.projectId, PERMISSIONS.PROJECT_DELETE);

  await repo.deleteProject(input.projectId);
}

export async function getActiveProject(
  workspaceId: string,
  preferredProjectId?: string
): Promise<{ id: string; name: string; key: string } | null> {
  try {
    await requireWorkspaceAccess(workspaceId);
  } catch {
    return null;
  }

  if (preferredProjectId) {
    const preferred = await repo.findProjectInWorkspace(
      preferredProjectId,
      workspaceId
    );

    if (preferred) return preferred;
  }

  return repo.findFirstProject(workspaceId);
}
