import "server-only";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { db } from "@/lib/db";
import { provisionNewUser } from "@/services/registration-service";
import type { AuthProvider, SessionUser } from "@/types/auth";

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  onboardedAt: true,
} as const;

function displayNameFrom(
  metadata: Record<string, unknown>,
  email: string
): string {
  const candidate = metadata.full_name ?? metadata.name;
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim();

  return email.split("@")[0];
}

export const supabaseAuthProvider: AuthProvider = {
  async getCurrentUser(): Promise<SessionUser | null> {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) return null;

    const email = user.email.toLowerCase();
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const avatarUrl =
      typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

    const [byId, byEmail] = await Promise.all([
      db.user.findUnique({ where: { id: user.id }, select: { id: true } }),
      db.user.findUnique({ where: { email }, select: { id: true } }),
    ]);

    // The same email can come back under a new auth id if the account was
    // deleted and recreated in the auth provider. Rebinding the existing row to
    // the new id keeps the user's workspaces and history instead of colliding
    // on the email unique constraint.
    if (!byId && byEmail) {
      await db.user.update({
        where: { email },
        data: { id: user.id, avatarUrl },
      });
    }

    const existing = byId ?? byEmail;

    const profile = await db.user.upsert({
      where: { id: user.id },
      update: { email, avatarUrl },
      create: {
        id: user.id,
        email,
        name: displayNameFrom(metadata, email),
        avatarUrl,
      },
      select: userSelect,
    });

    if (!existing) {
      await provisionNewUser({
        userId: profile.id,
        name: profile.name,
        email: profile.email,
      });
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      hasOnboarded: profile.onboardedAt !== null,
    };
  },
};
