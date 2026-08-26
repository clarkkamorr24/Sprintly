"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signInAction } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  { email: "owner@sprintly.dev", role: "Owner" },
  { email: "admin@sprintly.dev", role: "Admin" },
  { email: "member@sprintly.dev", role: "Member" },
] as const;

interface SignInFormProps {
  readonly redirectTo: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (value: string) => {
    setError(null);

    startTransition(async () => {
      const result = await signInAction({ email: value });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit(email);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "sign-in-error" : undefined}
            disabled={isPending}
            required
          />
        </div>

        {error ? (
          <p id="sign-in-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Or continue as a seeded demo account
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setEmail(account.email);
                submit(account.email);
              }}
            >
              {account.role}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
