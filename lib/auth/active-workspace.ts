import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { PATHNAME_HEADER } from "@/lib/constants";
import { db } from "@/lib/db";
import type { WorkspaceDTO } from "@/types/dto";

const WORKSPACE_PATH = /^\/workspaces\/([^/]+)/;
const PROJECT_PATH = /^\/projects\/([^/]+)/;

export const getRequestPathname = cache(async (): Promise<string> => {
  const headerList = await headers();
  return headerList.get(PATHNAME_HEADER) ?? "";
});

const findWorkspaceIdForProject = cache(
  async (projectId: string): Promise<string | null> => {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });

    return project?.workspaceId ?? null;
  }
);

export async function getRouteProjectId(): Promise<string | undefined> {
  const pathname = await getRequestPathname();
  return PROJECT_PATH.exec(pathname)?.[1];
}

export async function resolveActiveWorkspace(
  workspaces: readonly WorkspaceDTO[]
): Promise<WorkspaceDTO | null> {
  const pathname = await getRequestPathname();
  const fallback = workspaces[0] ?? null;

  const workspaceMatch = WORKSPACE_PATH.exec(pathname);
  if (workspaceMatch) {
    const slug = workspaceMatch[1];
    return workspaces.find((w) => w.slug === slug) ?? fallback;
  }

  const projectMatch = PROJECT_PATH.exec(pathname);
  if (projectMatch) {
    const owner = await findWorkspaceIdForProject(projectMatch[1]);
    if (owner) return workspaces.find((w) => w.id === owner) ?? fallback;
  }

  return fallback;
}
