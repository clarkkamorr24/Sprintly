import { Bug01Icon, File01Icon } from "@hugeicons/core-free-icons";

import { IssueType } from "@/lib/generated/prisma/enums";

export const ISSUE_TYPE_ORDER: readonly IssueType[] = [
  IssueType.TASK,
  IssueType.BUG,
];

export const ISSUE_TYPE_LETTER: Readonly<Record<IssueType, string>> = {
  [IssueType.TASK]: "T",
  [IssueType.BUG]: "B",
};

export const ISSUE_TYPE_LABEL: Readonly<Record<IssueType, string>> = {
  [IssueType.TASK]: "Task",
  [IssueType.BUG]: "Bug",
};

export const ISSUE_TYPE_COLOR: Readonly<Record<IssueType, string>> = {
  [IssueType.TASK]: "var(--sp-neutral-600)",
  [IssueType.BUG]: "var(--sp-accent)",
};

export const ISSUE_TYPE_ICON = {
  [IssueType.TASK]: File01Icon,
  [IssueType.BUG]: Bug01Icon,
} as const;

export const AVATAR_TONES = [
  "var(--sp-accent)",
  "var(--sp-neutral-800)",
  "var(--sp-neutral-600)",
  "var(--sp-neutral-700)",
] as const;

export function avatarTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}
