import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { requireUserOrRedirect } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Set password · Sprintly",
};

export default async function UpdatePasswordPage() {
  const user = await requireUserOrRedirect();

  return (
    <AuthShell
      title="Set a new password"
      description={`Choose a new password for ${user.email}.`}
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
