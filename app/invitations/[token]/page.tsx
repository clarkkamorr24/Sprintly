import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { isAppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth/session";
import {
  acceptInvitation,
  getInvitationLanding,
} from "@/services/invitation-service";

export const metadata: Metadata = {
  title: "Accept invitation · Sprintly",
};

export const dynamic = "force-dynamic";

export default async function AcceptInvitationPage(
  props: PageProps<"/invitations/[token]">
) {
  const { token } = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    const landing = await getInvitationLanding(token);

    if (landing.state === "invalid") {
      return <InvitationProblem message={landing.reason} signedIn={false} />;
    }

    const next = `/invitations/${token}`;
    const params = new URLSearchParams({ next, email: landing.email });

    redirect(
      landing.hasAccount
        ? `/sign-in?${params.toString()}`
        : `/sign-up?${params.toString()}`
    );
  }

  let message: string;

  try {
    const accepted = await acceptInvitation(token);
    redirect(`/${accepted.workspaceSlug}`);
  } catch (error) {
    unstable_rethrow(error);

    message = isAppError(error)
      ? error.message
      : "That invitation could not be accepted.";
  }

  return <InvitationProblem message={message} signedIn />;
}

function InvitationProblem({
  message,
  signedIn,
}: {
  readonly message: string;
  readonly signedIn: boolean;
}) {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
      <EmptyState
        title="Invitation not accepted"
        description={message}
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={signedIn ? "/" : "/sign-in"}>
                {signedIn ? "Go to your workspaces" : "Go to sign in"}
              </Link>
            }
          />
        }
      />
    </main>
  );
}
