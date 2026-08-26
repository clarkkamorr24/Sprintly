import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  DEV_SESSION_COOKIE,
  devAuthProvider,
  isDevAuthEnabled,
} from "@/lib/auth/dev-provider";
import { UnauthorizedError } from "@/lib/errors";
import type { AuthProvider, SessionUser } from "@/types/auth";

function resolveProvider(): AuthProvider {
  if (isDevAuthEnabled()) return devAuthProvider;

  return { getCurrentUser: async () => null };
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  return resolveProvider().getCurrentUser();
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireUserOrRedirect(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    const stale = (await cookies()).has(DEV_SESSION_COOKIE);
    redirect(stale ? "/sign-in?signedOut=1" : "/sign-in");
  }

  return user;
}
