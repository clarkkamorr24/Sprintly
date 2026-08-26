import { redirect } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { getCurrentUser } from "@/lib/auth/session";
import { listWorkspaces } from "@/services/workspace-service";

/** Every route in this group is per-user, so none of it may be prerendered. */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const workspaces = await listWorkspaces();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader user={user} workspaces={workspaces} />
      {children}
    </div>
  );
}
