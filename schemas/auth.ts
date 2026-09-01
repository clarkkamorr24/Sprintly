import * as z from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordRule {
  readonly id: string;
  readonly label: string;
  readonly test: (value: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "An uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "A lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "A number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: "A special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function unmetPasswordRules(value: string): readonly PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value));
}

export const passwordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH, {
    error: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`,
  })
  .superRefine((value, ctx) => {
    for (const rule of unmetPasswordRules(value)) {
      ctx.addIssue({
        code: "custom",
        message: `Password needs: ${rule.label.toLowerCase()}.`,
      });
    }
  });
