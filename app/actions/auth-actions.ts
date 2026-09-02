"use server";

import { redirect } from "next/navigation";
import * as z from "zod";

import { handleAction } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { InternalError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import { passwordSchema } from "@/schemas/auth";
import type { ApiResponse } from "@/types/api";

const emailSchema = z
  .email({ error: "Enter a valid email address." })
  .trim()
  .toLowerCase();

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password." }),
});

const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Enter your name." })
    .max(80, { error: "Name must be 80 characters or fewer." }),
  email: emailSchema,
  password: passwordSchema,
});

const resetSchema = z.object({ email: emailSchema });

const updatePasswordSchema = z.object({ password: passwordSchema });

function siteUrl(): string {
  return (
    process.env.SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

const GENERIC_CREDENTIALS = "Incorrect email or password.";

export async function signInAction(
  input: unknown
): Promise<ApiResponse<{ ok: true }>> {
  return handleAction("signInAction", async () => {
    const data = parseInput(signInSchema, input);

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new InternalError("Authentication is not configured.");

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.status === 429) {
        throw new UnauthorizedError(
          "Too many attempts. Wait a moment and try again."
        );
      }

      if (/email not confirmed/i.test(error.message)) {
        throw new UnauthorizedError(
          "Confirm your email address before signing in."
        );
      }

      throw new UnauthorizedError(GENERIC_CREDENTIALS);
    }

    return { ok: true as const };
  });
}

export async function signUpAction(
  input: unknown
): Promise<ApiResponse<{ needsConfirmation: boolean }>> {
  return handleAction("signUpAction", async () => {
    const data = parseInput(signUpSchema, input);

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new InternalError("Authentication is not configured.");

    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.name },
        emailRedirectTo: `${siteUrl()}/auth/callback`,
      },
    });

    if (error) {
      if (error.status === 429) {
        throw new ValidationError("Too many attempts. Try again shortly.", {
          email: ["Too many attempts. Try again shortly."],
        });
      }

      if (/already registered|already exists/i.test(error.message)) {
        throw new ValidationError("That email cannot be used.", {
          email: ["An account with that email already exists. Sign in instead."],
        });
      }

      console.error("[signUpAction]", error.message);
      throw new InternalError("Could not create the account. Try again.");
    }

    return { needsConfirmation: result.session === null };
  });
}

export async function requestPasswordResetAction(
  input: unknown
): Promise<ApiResponse<{ ok: true }>> {
  return handleAction("requestPasswordResetAction", async () => {
    const data = parseInput(resetSchema, input);

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new InternalError("Authentication is not configured.");

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${siteUrl()}/auth/callback?next=/account/password`,
    });

    if (error) console.error("[requestPasswordResetAction]", error.message);

    return { ok: true as const };
  });
}

export async function updatePasswordAction(
  input: unknown
): Promise<ApiResponse<{ ok: true }>> {
  return handleAction("updatePasswordAction", async () => {
    const data = parseInput(updatePasswordSchema, input);

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new InternalError("Authentication is not configured.");

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      throw new ValidationError("Could not update the password.", {
        password: [error.message],
      });
    }

    return { ok: true as const };
  });
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/sign-in");
}
