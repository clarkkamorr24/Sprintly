import { AppHeader } from "@/components/shared/app-header";
import { requireUserOrRedirect } from "@/lib/auth/session";
import { getUnreadCount } from "@/services/notification-service";
import { listWorkspaces } from "@/services/workspace-service";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUserOrRedirect();

  const [workspaces, unreadCount] = await Promise.all([
    listWorkspaces(),
    getUnreadCount(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        user={user}
        workspaces={workspaces}
        unreadCount={unreadCount}
      />
      {children}
    </div>
  );
}
