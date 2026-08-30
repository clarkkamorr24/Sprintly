"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signUpAction } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldErrors } from "@/types/api";

interface SignUpFormProps {
  readonly next: string;
  readonly lockedEmail?: string;
}

export function SignUpForm({ next, lockedEmail }: SignUpFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    const formData = new FormData(event.currentTarget);
    const email = lockedEmail ?? String(formData.get("email") ?? "");

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await signUpAction({
        name: formData.get("name"),
        email,
        password: formData.get("password"),
      });

      if (!result.success) {
        setFieldErrors(result.error.fieldErrors ?? {});
        setFormError(result.error.fieldErrors ? null : result.error.message);
        return;
      }

      if (result.data.needsConfirmation) {
        setSentTo(email);
        return;
      }

      router.replace(next);
      router.refresh();
    });
  };

  if (sentTo) {
    return (
      <div role="status" className="space-y-4">
        <p className="text-sm">
          Check <strong>{sentTo}</strong> for a confirmation link to finish
          creating your account.
        </p>
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => setSentTo(null)}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            autoFocus
            placeholder="John Doe"
            aria-invalid={fieldErrors.name ? true : undefined}
            disabled={isPending}
            required
          />
          {fieldErrors.name ? (
            <p role="alert" className="text-sm text-(--sp-accent-700)">
              {fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            defaultValue={lockedEmail}
            readOnly={lockedEmail !== undefined}
            aria-readonly={lockedEmail !== undefined || undefined}
            aria-describedby={lockedEmail ? "email-locked" : undefined}
            aria-invalid={fieldErrors.email ? true : undefined}
            disabled={isPending}
            required
          />
          {lockedEmail ? (
            <p
              id="email-locked"
              className="text-[12px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]"
            >
              This invitation was sent to {lockedEmail}.
            </p>
          ) : null}
          {fieldErrors.email ? (
            <p role="alert" className="text-sm text-(--sp-accent-700)">
              {fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={fieldErrors.password ? true : undefined}
            disabled={isPending}
            required
          />
          {fieldErrors.password ? (
            <p role="alert" className="text-sm text-(--sp-accent-700)">
              {fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p role="alert" className="text-sm text-(--sp-accent-700)">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full justify-center"
          disabled={isPending}
        >
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-extrabold text-(--sp-accent) underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
