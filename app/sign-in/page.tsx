import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in · Sprintly",
};

const ERROR_MESSAGE: Readonly<Record<string, string>> = {
  missing_code: "That link was incomplete. Request a new one.",
  invalid_link: "That link has expired or was already used.",
  unconfigured: "Authentication is not configured for this environment.",
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const searchParams = await props.searchParams;
  const error = single(searchParams.error);

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your workspace."
    >
      {error ? (
        <p role="alert" className="mb-4 text-sm text-(--sp-accent-700)">
          {ERROR_MESSAGE[error] ?? "Sign-in failed. Please try again."}
        </p>
      ) : null}

      <SignInForm next={safeNext(single(searchParams.next))} />
    </AuthShell>
  );
}
