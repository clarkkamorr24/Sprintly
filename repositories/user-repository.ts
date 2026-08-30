import "server-only";

import { db } from "@/lib/db";

export function markOnboarded(userId: string) {
  return db.user.updateMany({
    where: { id: userId, onboardedAt: null },
    data: { onboardedAt: new Date() },
  });
}
