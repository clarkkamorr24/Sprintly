import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { supabaseAuthProvider } from "@/lib/auth/supabase-provider";
import { UnauthorizedError } from "@/lib/errors";
import type { SessionUser } from "@/types/auth";

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  return supabaseAuthProvider.getCurrentUser();
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireUserOrRedirect(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
