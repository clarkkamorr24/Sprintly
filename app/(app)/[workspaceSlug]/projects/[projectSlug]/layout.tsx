import { resolveProjectBySlug } from "@/lib/auth/workspace-page";
import { loadPage } from "@/lib/page-guard";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/[workspaceSlug]/projects/[projectSlug]">) {
  const { workspaceSlug, projectSlug } = await params;

  await loadPage(() => resolveProjectBySlug(workspaceSlug, projectSlug));

  return children;
}
