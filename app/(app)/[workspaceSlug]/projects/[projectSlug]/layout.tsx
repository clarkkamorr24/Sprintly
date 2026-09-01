import { resolveProjectBySlug } from "@/lib/auth/workspace-page";
import { loadPage } from "@/lib/page-guard";

/**
 * Resolves the project above the workspace loading.tsx boundary. Once Suspense
 * streams the shell the response has already committed a 200, so an unknown or
 * out-of-workspace slug has to be rejected here to return a real 404.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/[workspaceSlug]/projects/[projectSlug]">) {
  const { workspaceSlug, projectSlug } = await params;

  await loadPage(() => resolveProjectBySlug(workspaceSlug, projectSlug));

  return children;
}
