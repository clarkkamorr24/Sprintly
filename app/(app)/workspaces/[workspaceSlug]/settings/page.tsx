import type { Metadata } from "next";
import Link from "next/link";

import { DangerZone } from "@/components/workspace/danger-zone";
import { WorkspaceGeneralForm } from "@/components/workspace/workspace-general-form";
import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { WorkspaceRole } from "@/lib/generated/prisma/enums";
import { loadPage } from "@/lib/page-guard";
import { getWorkspace, listMembers } from "@/services/workspace-service";

export const metadata: Metadata = {
  title: "Workspace settings · Sprintly",
};

export default async function WorkspaceSettingsPage(
  props: PageProps<"/workspaces/[workspaceSlug]/settings">
) {
  const { workspaceSlug } = await props.params;

  const { context, workspace, members } = await loadPage(async () => {
    const context = await requireWorkspaceBySlug(workspaceSlug);

    const [workspace, members] = await Promise.all([
      getWorkspace(context.workspaceId),
      listMembers(context.workspaceId),
    ]);

    return { context, workspace, members };
  });

  const workspaceId = context.workspaceId;

  const canUpdate = can(context.role, PERMISSIONS.WORKSPACE_UPDATE);
  const isOwner = context.role === WorkspaceRole.OWNER;

  const transferTargets = members
    .filter((member) => member.user.id !== context.user.id)
    .map((member) => ({ id: member.user.id, name: member.user.name }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 lg:px-6">
      <header className="space-y-1">
        <nav aria-label="Breadcrumb" className="sp-kicker">
          <Link
            href={`/workspaces/${workspaceSlug}`}
            className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {workspace.name}
          </Link>{" "}
          / Settings
        </nav>
        <h1 className="text-[32px]">Workspace settings</h1>
      </header>

      <section aria-labelledby="general-heading" className="space-y-3">
        <h2 id="general-heading" className="sp-kicker text-[13px]">
          General
        </h2>
        <WorkspaceGeneralForm
          workspaceId={workspaceId}
          name={workspace.name}
          slug={workspace.slug}
          description={workspace.description}
          canUpdate={canUpdate}
        />
      </section>

      <section aria-labelledby="members-heading" className="space-y-3">
        <h2 id="members-heading" className="sp-kicker text-[13px]">
          Members
        </h2>
        <div className="sp-panel p-4">
          <p className="text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
            {workspace.memberCount}{" "}
            {workspace.memberCount === 1 ? "member" : "members"} ·{" "}
            {workspace.projectCount}{" "}
            {workspace.projectCount === 1 ? "project" : "projects"}
          </p>
          <Link
            href={`/workspaces/${workspaceSlug}/team`}
            className="mt-2 inline-block text-sm text-(--sp-accent) underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Manage the team and invitations
          </Link>
        </div>
      </section>

      {isOwner ? (
        <section aria-labelledby="danger-heading" className="space-y-3">
          <h2 id="danger-heading" className="sp-kicker text-[13px] text-(--sp-accent-700)">
            Danger zone
          </h2>
          <DangerZone
            workspaceId={workspaceId}
            workspaceName={workspace.name}
            transferTargets={transferTargets}
          />
        </section>
      ) : null}
    </main>
  );
}
