import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { loadPage } from "@/lib/page-guard";

export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/workspaces/[workspaceSlug]">) {
  const { workspaceSlug } = await params;

  await loadPage(() => requireWorkspaceBySlug(workspaceSlug));

  return children;
}
