import { AppHeader } from "@/components/shared/app-header";
import { MobileNavProvider } from "@/components/shared/mobile-nav-context";
import { AppSidebar } from "@/components/shared/app-sidebar";
import {
  getRouteProjectId,
  resolveActiveWorkspace,
} from "@/lib/auth/active-workspace";
import { requireUserOrRedirect } from "@/lib/auth/session";
import { getActiveProject } from "@/services/project-service";
import { getUnreadCount } from "@/services/notification-service";
import { listWorkspaces } from "@/services/workspace-service";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUserOrRedirect();

  const [workspaces, unreadCount] = await Promise.all([
    listWorkspaces(),
    getUnreadCount(),
  ]);

  const activeWorkspace = await resolveActiveWorkspace(workspaces);
  const activeWorkspaceId = activeWorkspace?.id ?? "";
  const activeProject = activeWorkspace
    ? await getActiveProject(activeWorkspace.id, await getRouteProjectId())
    : null;

  return (
    <MobileNavProvider>
      <div className="flex min-h-full flex-1">
        <AppSidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          activeWorkspaceSlug={activeWorkspace?.slug ?? ""}
          activeProject={activeProject}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            user={user}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            unreadCount={unreadCount}
          />
          {children}
        </div>
      </div>
    </MobileNavProvider>
  );
}
