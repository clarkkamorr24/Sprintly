import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { PATHNAME_HEADER } from "@/lib/constants";
import { parseRoute } from "@/lib/routes";
import type { WorkspaceDTO } from "@/types/dto";

export const getRequestPathname = cache(async (): Promise<string> => {
  const headerList = await headers();
  return headerList.get(PATHNAME_HEADER) ?? "";
});

export async function resolveActiveWorkspace(
  workspaces: readonly WorkspaceDTO[]
): Promise<WorkspaceDTO | null> {
  const pathname = await getRequestPathname();
  const fallback = workspaces[0] ?? null;

  const { workspaceSlug } = parseRoute(pathname);
  if (workspaceSlug) {
    return workspaces.find((w) => w.slug === workspaceSlug) ?? fallback;
  }

  return fallback;
}
