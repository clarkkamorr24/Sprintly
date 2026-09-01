"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePasswordAction } from "@/app/actions/auth-actions";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldErrors } from "@/types/api";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    const formData = new FormData(event.currentTarget);

    const confirm = String(formData.get("confirm") ?? "");

    setFieldErrors({});
    setFormError(null);

    if (password !== confirm) {
      setFieldErrors({ confirm: ["Both passwords must match."] });
      return;
    }

    startTransition(async () => {
      const result = await updatePasswordAction({ password });

      if (!result.success) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFormError(result.error.fieldErrors ? null : result.error.message);
        return;
      }

      toast.success("Password updated.");
      router.replace("/");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="Choose a strong password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="new-password-requirements"
          aria-invalid={fieldErrors.password ? true : undefined}
          disabled={isPending}
          required
        />

        <PasswordChecklist id="new-password-requirements" value={password} />

        {fieldErrors.password ? (
          <p role="alert" className="text-sm text-(--sp-accent-700)">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={fieldErrors.confirm ? true : undefined}
          disabled={isPending}
          required
        />
        {fieldErrors.confirm ? (
          <p role="alert" className="text-sm text-(--sp-accent-700)">
            {fieldErrors.confirm[0]}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-(--sp-accent-700)">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full justify-center" disabled={isPending}>
        {isPending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
