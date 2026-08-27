import { redirect } from "next/navigation";

import { requireUserOrRedirect } from "@/lib/auth/session";
import { listProjects } from "@/services/project-service";
import { listWorkspaces } from "@/services/workspace-service";

export default async function HomePage() {
  await requireUserOrRedirect();

  const workspaces = await listWorkspaces();
  const workspace = workspaces[0];

  if (!workspace) redirect("/onboarding");

  const projects = await listProjects({ workspaceId: workspace.id });

  if (projects.length === 0 && workspaces.length === 1) {
    redirect("/onboarding");
  }

  redirect(`/workspaces/${workspace.id}`);
}
