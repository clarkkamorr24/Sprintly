import "server-only";

import { cookies } from "next/headers";

import { db } from "@/lib/db";
import type { AuthProvider, SessionUser } from "@/types/auth";

export const DEV_SESSION_COOKIE = "sprintly_dev_user";

export function isDevAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_MODE === "true"
  );
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
} as const;

export const devAuthProvider: AuthProvider = {
  async getCurrentUser(): Promise<SessionUser | null> {
    if (!isDevAuthEnabled()) return null;

    const userId = (await cookies()).get(DEV_SESSION_COOKIE)?.value;
    if (!userId) return null;

    return db.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  },
};
