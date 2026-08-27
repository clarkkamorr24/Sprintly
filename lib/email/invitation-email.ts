import "server-only";

import { createClient } from "@supabase/supabase-js";

export function invitationUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  return `${base}/invitations/${token}`;
}

export interface InvitationEmailInput {
  readonly email: string;
  readonly token: string;
  readonly workspaceName: string;
  readonly inviterName: string;
}

export async function sendInvitationEmail(
  input: InvitationEmailInput
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const link = invitationUrl(input.token);

  if (!url || !serviceKey) {
    console.warn(
      `[invitation] Email not configured. Share this link with ${input.email}: ${link}`
    );
    return;
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

  if (!error) return;

  const alreadyRegistered = /already been registered|already exists/i.test(
    error.message
  );

  if (alreadyRegistered) {
    const { error: linkError } = await admin.auth.signInWithOtp({
      email: input.email,
      options: { emailRedirectTo: link },
    });

    if (!linkError) return;
    console.error("[invitation] magic link failed:", linkError.message);
  } else {
    console.error("[invitation] invite failed:", error.message);
  }

  console.warn(
    `[invitation] Could not email ${input.email}. Share this link manually: ${link}`
  );
}
