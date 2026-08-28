import type { Metadata } from "next";

import { MemberRow } from "@/components/workspace/member-row";
import { PendingInvitations } from "@/components/workspace/pending-invitations";
import { InviteMemberForm } from "@/components/workspace/invite-member-form";
import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { listInvitations } from "@/services/invitation-service";
import { getWorkspace, listMembers } from "@/services/workspace-service";

export const metadata: Metadata = {
  title: "Team · Sprintly",
};

export default async function TeamPage(
  props: PageProps<"/workspaces/[workspaceSlug]/team">
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

  const canInvite = can(context.role, PERMISSIONS.MEMBER_INVITE);
  const invitations = canInvite ? await listInvitations(workspaceId) : [];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          People with access to {workspace.name}.
        </p>
      </header>

      {canInvite ? <InviteMemberForm workspaceId={workspaceId} /> : null}

      <section aria-labelledby="members-heading" className="space-y-3">
        <h2 id="members-heading" className="text-sm font-semibold">
          {members.length} {members.length === 1 ? "member" : "members"}
        </h2>

        <ul className="sp-panel divide-y divide-(--sp-neutral-300)">
          {members.map((member) => (
            <MemberRow
              key={member.user.id}
              workspaceId={workspaceId}
              member={member}
              currentUserId={context.user.id}
              canManageRoles={can(context.role, PERMISSIONS.MEMBER_ROLE_UPDATE)}
              canRemove={can(context.role, PERMISSIONS.MEMBER_REMOVE)}
            />
          ))}
        </ul>
      </section>

      {canInvite ? (
        <PendingInvitations invitations={invitations} />
      ) : null}
    </main>
  );
}
