import "server-only";

import { requireUser } from "@/lib/auth/session";
import * as repo from "@/repositories/user-repository";

export async function completeOnboarding(): Promise<void> {
  const user = await requireUser();

  await repo.markOnboarded(user.id);
}
