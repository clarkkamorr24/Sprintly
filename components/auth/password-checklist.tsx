"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

import { PASSWORD_RULES } from "@/schemas/auth";
import { cn } from "@/lib/utils";

interface PasswordChecklistProps {
  readonly value: string;
  readonly id?: string;
}

export function PasswordChecklist({ value, id }: PasswordChecklistProps) {
  const met = PASSWORD_RULES.filter((rule) => rule.test(value)).length;

  return (
    <div id={id}>
      <p aria-live="polite" className="sr-only">
        {met} of {PASSWORD_RULES.length} password requirements met.
      </p>

      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const satisfied = rule.test(value);

          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-[12px] transition-colors",
                satisfied
                  ? "text-(--sp-text)"
                  : "text-[color-mix(in_srgb,var(--sp-text)_50%,transparent)]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-[14px] shrink-0 items-center justify-center border transition-colors",
                  satisfied
                    ? "border-(--sp-accent) bg-(--sp-accent) text-(--sp-bg)"
                    : "border-(--sp-neutral-400)"
                )}
              >
                {satisfied ? (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={3}
                    className="size-2.5"
                  />
                ) : null}
              </span>
              <span className="sr-only">
                {satisfied ? "Met:" : "Not met:"}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
