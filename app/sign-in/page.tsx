import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in · Sprintly",
};

function safeRedirect(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";

  return next;
}

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const searchParams = await props.searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Sprintly</CardTitle>
          <CardDescription>
            {searchParams.signedOut
              ? "Your previous session is no longer valid. Sign in again."
              : "Development sign-in. Supabase Auth replaces this without changing any calling code."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm redirectTo={safeRedirect(searchParams.next)} />
        </CardContent>
      </Card>
    </main>
  );
}
