"use client";

import { useMemo, useRef, useState } from "react";

import { InitialsTile } from "@/components/shared/initials-tile";
import { Textarea } from "@/components/ui/textarea";
import { mentionHandle } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/types/dto";

const MAX_SUGGESTIONS = 6;

interface MentionTextareaProps {
  readonly value: string;
  readonly members: readonly UserDTO[];
  readonly currentUserId: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly rows?: number;
  readonly "aria-label"?: string;
  readonly onChange: (value: string) => void;
}

export function MentionTextarea({
  value,
  members,
  currentUserId,
  placeholder,
  disabled,
  rows = 3,
  onChange,
  ...rest
}: MentionTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const query = useMemo(() => {
    if (dismissed) return null;

    const before = value.slice(0, caret);
    const match = /(?:^|\s)@([\w.-]*)$/.exec(before);

    return match ? match[1] : null;
  }, [value, caret, dismissed]);

  const suggestions = useMemo(() => {
    if (query === null) return [];

    const needle = query.toLowerCase();

    return members
      .filter((member) => member.id !== currentUserId)
      .filter(
        (member) =>
          needle === "" ||
          member.name.toLowerCase().includes(needle) ||
          member.email.toLowerCase().startsWith(needle)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [members, query, currentUserId]);

  const open = suggestions.length > 0;

  const insert = (member: UserDTO) => {
    const before = value.slice(0, caret);
    const start = before.lastIndexOf("@");
    if (start < 0) return;

    const next = `${value.slice(0, start)}@${mentionHandle(member.name)} ${value.slice(caret)}`;
    const nextCaret = start + mentionHandle(member.name).length + 2;

    onChange(next);
    setDismissed(true);
    setActive(0);

    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(nextCaret, nextCaret);
      setCaret(nextCaret);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insert(suggestions[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDismissed(true);
    }
  };

  const syncCaret = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCaret(event.currentTarget.selectionStart ?? 0);
  };

  return (
    <div className="relative">
      <Textarea
        {...rest}
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? "mention-suggestions" : undefined}
        onChange={(event) => {
          setDismissed(false);
          setActive(0);
          setCaret(event.target.selectionStart ?? 0);
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        onBlur={() => window.setTimeout(() => setDismissed(true), 120)}
      />

      {open ? (
        <ul
          id="mention-suggestions"
          role="listbox"
          aria-label="Workspace members"
          className="absolute bottom-full z-20 mb-1 max-h-[200px] w-full max-w-[280px] overflow-y-auto border border-(--sp-neutral-300) bg-(--sp-neutral-100) shadow-md"
        >
          {suggestions.map((member, index) => (
            <li key={member.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insert(member)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] outline-none transition-colors",
                  index === active
                    ? "bg-(--sp-neutral-900) text-(--sp-bg)"
                    : "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]"
                )}
              >
                <InitialsTile user={member} size="xs" />
                <span className="min-w-0 flex-1 truncate">{member.name}</span>
                <span
                  className={cn(
                    "sp-mono-key shrink-0 text-[11px]",
                    index === active
                      ? "opacity-70"
                      : "text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]"
                  )}
                >
                  @{mentionHandle(member.name)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
