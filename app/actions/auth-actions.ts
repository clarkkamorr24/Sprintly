"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";

import { handleAction } from "@/lib/api-response";
import { DEV_SESSION_COOKIE, isDevAuthEnabled } from "@/lib/auth/dev-provider";
import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import type { ApiResponse } from "@/types/api";

const signInSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
});

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;


export async function signInAction(
  input: unknown
): Promise<ApiResponse<{ id: string }>> {
  return handleAction("signInAction", async () => {
    if (!isDevAuthEnabled()) {
      throw new ForbiddenError("Development sign-in is disabled.");
    }

    const { email } = parseInput(signInSchema, input);

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) throw new NotFoundError("No account found for that email.");

    (await cookies()).set(DEV_SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return { id: user.id };
  });
}

export async function signOutAction(): Promise<void> {
  (await cookies()).delete(DEV_SESSION_COOKIE);
  redirect("/sign-in");
}
