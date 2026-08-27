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

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const searchParams = await props.searchParams;

  return (
    <AuthShell
      title="Create your account"
      description="Start planning work in your own Sprintly workspace."
    >
      <SignUpForm next={safeNext(single(searchParams.next))} />
    </AuthShell>
  );
}
