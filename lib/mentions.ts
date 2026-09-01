export const MENTION_PATTERN = /@([\w.-]+)/g;

export function mentionHandle(name: string): string {
  return name.replace(/\s+/g, "");
}

export function extractMentionHandles(body: string): readonly string[] {
  return [
    ...new Set(
      [...body.matchAll(MENTION_PATTERN)].map((match) => match[1].toLowerCase())
    ),
  ];
}
