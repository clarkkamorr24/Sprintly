import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up · Sprintly",
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invitedEmail(value: string | undefined): string | undefined {
  const email = value?.trim().toLowerCase();
  return email && EMAIL_PATTERN.test(email) ? email : undefined;
}

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const searchParams = await props.searchParams;
  const lockedEmail = invitedEmail(single(searchParams.email));

  return (
    <AuthShell
      title="Create your account"
      description={
        lockedEmail
          ? "Finish setting up your account to join the workspace you were invited to."
          : "Start planning work in your own Sprintly workspace."
      }
    >
      <SignUpForm
        next={safeNext(single(searchParams.next))}
        lockedEmail={lockedEmail}
      />
    </AuthShell>
  );
}
