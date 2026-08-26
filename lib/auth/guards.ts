import "server-only";

import { cache } from "react";

import { requireUser } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { ProjectContext, WorkspaceContext } from "@/types/auth";

export const requireWorkspaceAccess = cache(
  async (workspaceId: string): Promise<WorkspaceContext> => {
    const user = await requireUser();

    const membership = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      select: { role: true, workspace: { select: { archivedAt: true } } },
    });

    if (!membership) throw new NotFoundError("Workspace not found.");

    return { user, workspaceId, role: membership.role };
  }
);

export async function requireWorkspacePermission(
  workspaceId: string,
  permission: Permission
): Promise<WorkspaceContext> {
  const context = await requireWorkspaceAccess(workspaceId);

  if (!can(context.role, permission)) {
    throw new ForbiddenError("You do not have permission to do that.");
  }

  return context;
}

export const requireProjectAccess = cache(
  async (projectId: string): Promise<ProjectContext> => {
    const user = await requireUser();

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        workspaceId: true,
        members: { where: { userId: user.id }, select: { id: true } },
        workspace: {
          select: {
            members: {
              where: { userId: user.id },
              select: { role: true },
            },
          },
        },
      },
    });

    const membership = project?.workspace.members[0];
    if (!project || !membership) throw new NotFoundError("Project not found.");

    return {
      user,
      workspaceId: project.workspaceId,
      role: membership.role,
      projectId,
      isProjectMember: project.members.length > 0,
    };
  }
);

export async function requireProjectPermission(
  projectId: string,
  permission: Permission
): Promise<ProjectContext> {
  const context = await requireProjectAccess(projectId);

  if (!can(context.role, permission)) {
    throw new ForbiddenError("You do not have permission to do that.");
  }

  return context;
}
