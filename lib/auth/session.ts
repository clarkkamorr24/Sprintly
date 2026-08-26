import "server-only";

import { cache } from "react";

import { devAuthProvider, isDevAuthEnabled } from "@/lib/auth/dev-provider";
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
