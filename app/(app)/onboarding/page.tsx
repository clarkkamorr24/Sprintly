import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireUserOrRedirect } from "@/lib/auth/session";
import { listWorkspaces } from "@/services/workspace-service";

export const metadata: Metadata = {
  title: "Welcome · Sprintly",
};

export default async function OnboardingPage() {
  const user = await requireUserOrRedirect();
  const workspaces = await listWorkspaces();

  const workspace = workspaces[0];
  if (!workspace) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <OnboardingFlow
        userName={user.name}
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
      />
    </main>
  );
}
