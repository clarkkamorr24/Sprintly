import { MENTION_PATTERN, mentionHandle } from "@/lib/mentions";
import type { UserDTO } from "@/types/dto";

interface CommentBodyProps {
  readonly body: string;
  readonly members: readonly UserDTO[];
}


export function CommentBody({ body, members }: CommentBodyProps) {
  const byHandle = new Map(
    members.flatMap((member) => {
      const entries: [string, UserDTO][] = [
        [mentionHandle(member.name).toLowerCase(), member],
        [member.name.split(/\s+/)[0].toLowerCase(), member],
        [member.email.split("@")[0].toLowerCase(), member],
      ];
      return entries;
    })
  );

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of body.matchAll(MENTION_PATTERN)) {
    const index = match.index ?? 0;
    const member = byHandle.get(match[1].toLowerCase());

    if (!member) continue;

    if (index > cursor) parts.push(body.slice(cursor, index));

    parts.push(
      <span
        key={`${index}-${member.id}`}
        title={`${member.name} · ${member.email}`}
        className="font-semibold text-(--sp-accent-700)"
      >
        {match[0]}
      </span>
    );

    cursor = index + match[0].length;
  }

  if (cursor < body.length) parts.push(body.slice(cursor));

  return <p className="text-sm whitespace-pre-wrap">{parts}</p>;
}
