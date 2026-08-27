"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import {
  requestPasswordResetAction,
  signInAction,
} from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldErrors } from "@/types/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignInFormProps {
  readonly next: string;
}

export function SignInForm({ next }: SignInFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "password") passwordRef.current?.focus();
  }, [step]);

  const goToPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const value = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(value)) {
      setFieldErrors({ email: ["Enter a valid email address."] });
      return;
    }

    setEmail(value);
    setStep("password");
  };

  const backToEmail = () => {
    setStep("email");
    setPassword("");
    setFieldErrors({});
    setFormError(null);
    setResetSent(false);
  };

  const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await signInAction({ email, password });

      if (!result.success) {
        setFormError(result.error.message);
        setPassword("");
        passwordRef.current?.focus();
        return;
      }

      router.replace(next);
      router.refresh();
    });
  };

  const sendReset = () => {
    if (isPending) return;
    setFormError(null);

    startTransition(async () => {
      await requestPasswordResetAction({ email });
      setResetSent(true);
    });
  };

  const signUpLink = (
    <p className="mt-4 text-[13px] text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
      Don&apos;t have an account?{" "}
      <Link
        href="/sign-up"
        className="font-extrabold text-(--sp-accent) underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        Sign up
      </Link>
    </p>
  );

  if (step === "email") {
    return (
      <div className="animate-in fade-in duration-200">
        <form onSubmit={goToPassword} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              required
            />
            {fieldErrors.email ? (
              <p id="email-error" role="alert" className="text-sm text-(--sp-accent-700)">
                {fieldErrors.email[0]}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full justify-center">
            Continue
          </Button>
        </form>

        {signUpLink}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
          {email}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={backToEmail}
          disabled={isPending}
          className="gap-1 text-(--sp-accent)"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.5} className="size-3" />
          Back
        </Button>
      </div>

      <form onSubmit={submitPassword} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? "signin-error" : undefined}
            disabled={isPending}
            required
          />
        </div>

        {formError ? (
          <p id="signin-error" role="alert" className="text-sm text-(--sp-accent-700)">
            {formError}
          </p>
        ) : null}

        {resetSent ? (
          <p role="status" className="text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <button
            type="button"
            onClick={sendReset}
            disabled={isPending}
            className="text-[13px] text-(--sp-accent) underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Forgot password?
          </button>
        )}

        <Button
          type="submit"
          className="w-full justify-center"
          disabled={isPending || !password}
        >
          {isPending ? "Signing in…" : "Log in"}
        </Button>
      </form>

      {signUpLink}
    </div>
  );
}
