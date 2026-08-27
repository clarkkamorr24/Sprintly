import { IssueType } from "@/lib/generated/prisma/enums";

export const ISSUE_TYPE_LETTER: Readonly<Record<IssueType, string>> = {
  [IssueType.STORY]: "S",
  [IssueType.TASK]: "T",
  [IssueType.BUG]: "B",
  [IssueType.EPIC]: "E",
};

export const ISSUE_TYPE_LABEL: Readonly<Record<IssueType, string>> = {
  [IssueType.STORY]: "Story",
  [IssueType.TASK]: "Task",
  [IssueType.BUG]: "Bug",
  [IssueType.EPIC]: "Epic",
};

export const ISSUE_TYPE_COLOR: Readonly<Record<IssueType, string>> = {
  [IssueType.STORY]: "var(--sp-neutral-800)",
  [IssueType.TASK]: "var(--sp-neutral-600)",
  [IssueType.BUG]: "var(--sp-accent)",
  [IssueType.EPIC]: "var(--sp-neutral-900)",
};

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
