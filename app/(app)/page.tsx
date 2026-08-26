import { redirect } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { listWorkspaces } from "@/services/workspace-service";

export default async function HomePage() {
  const workspaces = await listWorkspaces();

  if (workspaces.length > 0) {
    redirect(`/workspaces/${workspaces[0].id}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <EmptyState
        title="No workspaces yet"
        description="Create a workspace from the switcher above to start organising projects and inviting your team."
      />
    </main>
  );
}
