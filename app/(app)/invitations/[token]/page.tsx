import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { isAppError } from "@/lib/errors";
import { requireUserOrRedirect } from "@/lib/auth/session";
import { acceptInvitation } from "@/services/invitation-service";

export const metadata: Metadata = {
  title: "Accept invitation · Sprintly",
};

export default async function AcceptInvitationPage(
  props: PageProps<"/invitations/[token]">
) {
  const { token } = await props.params;

  await requireUserOrRedirect();

  let message: string;

  try {
    const accepted = await acceptInvitation(token);
    redirect(`/workspaces/${accepted.workspaceId}`);
  } catch (error) {
    unstable_rethrow(error);

    message = isAppError(error)
      ? error.message
      : "That invitation could not be accepted.";
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
      <EmptyState
        title="Invitation not accepted"
        description={message}
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/">Go to your workspaces</Link>}
          />
        }
      />
    </main>
  );
}
