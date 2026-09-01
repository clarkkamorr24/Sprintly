import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { NotFoundError } from "@/lib/errors";
import * as repo from "@/repositories/project-repository";

export const PROJECT_COOKIE_PREFIX = "sp_project_";

export function projectCookieName(workspaceId: string): string {
  return `${PROJECT_COOKIE_PREFIX}${workspaceId}`;
}

export interface ActiveProject {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly slug: string;
}

export const resolveWorkspaceProject = cache(
  async (workspaceId: string): Promise<ActiveProject | null> => {
    const cookieStore = await cookies();
    const selected = cookieStore.get(projectCookieName(workspaceId))?.value;

    if (selected) {
      const project = await repo.findProjectInWorkspace(selected, workspaceId);
      if (project) return project;
    }

    return repo.findFirstProject(workspaceId);
  }
);

export async function requireWorkspaceProject(
  workspaceId: string
): Promise<ActiveProject> {
  const project = await resolveWorkspaceProject(workspaceId);

  if (!project) {
    throw new NotFoundError("This workspace has no projects yet.");
  }

  return project;
}
