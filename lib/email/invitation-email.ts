import "server-only";

import { createClient } from "@supabase/supabase-js";

export function invitationUrl(token: string): string {
  const base =
    process.env.SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  return `${base}/invitations/${token}`;
}

export interface InvitationEmailInput {
  readonly email: string;
  readonly token: string;
  readonly workspaceName: string;
  readonly inviterName: string;
}

export type InvitationEmailResult =
  | { readonly sent: true }
  | { readonly sent: false; readonly reason: "unconfigured" | "rate_limited" | "failed" };

function classify(message: string): "rate_limited" | "failed" {
  return /rate limit/i.test(message) ? "rate_limited" : "failed";
}

export async function sendInvitationEmail(
  input: InvitationEmailInput
): Promise<InvitationEmailResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const link = invitationUrl(input.token);

  if (!url || !serviceKey) {
    console.warn(
      `[invitation] Email not configured. Share this link with ${input.email}: ${link}`
    );
    return { sent: false, reason: "unconfigured" };
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: link,
    data: {
      workspace_name: input.workspaceName,
      invited_by: input.inviterName,
    },
  });

  if (!error) return { sent: true };

  const alreadyRegistered = /already been registered|already exists/i.test(
    error.message
  );

  if (alreadyRegistered) {
    const { error: linkError } = await admin.auth.signInWithOtp({
      email: input.email,
      options: { emailRedirectTo: link },
    });

    if (!linkError) return { sent: true };

    console.error("[invitation] magic link failed:", linkError.message);
    return { sent: false, reason: classify(linkError.message) };
  }

  console.error("[invitation] invite failed:", error.message);
  return { sent: false, reason: classify(error.message) };
}
