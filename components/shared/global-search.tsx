"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { searchWorkspaceAction } from "@/app/actions/search-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { workspacePath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { SearchResultsDTO } from "@/types/dto";

const EMPTY: SearchResultsDTO = { issues: [], projects: [], members: [] };

interface GlobalSearchProps {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
}

export function GlobalSearch({
  workspaceId,
  workspaceSlug,
}: GlobalSearchProps) {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultsDTO>(EMPTY);
  const [isLoading, setLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const requestId = useRef(0);

  const runSearch = useDebouncedCallback(async (value: string) => {
    const trimmed = value.trim();

    if (!trimmed || !workspaceId) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    const result = await searchWorkspaceAction({ workspaceId, query: trimmed });

    if (id !== requestId.current) return;

    setResults(result.success ? result.data : EMPTY);
    setLoading(false);
  }, 250);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const onChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    setLoading(value.trim().length > 0);
    runSearch(value);
  };

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
    router.push(href);
  };

  const total =
    results.issues.length + results.projects.length + results.members.length;

  const showPanel = isOpen && query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className="relative hidden max-w-[420px] flex-1 md:block"
    >
      <div className="flex items-center gap-2 border border-(--sp-neutral-300) bg-(--sp-neutral-100) px-2.5 py-1.5">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="size-[15px] shrink-0 opacity-55"
        />
        <input
          type="text"
          role="combobox"
          value={query}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search issues, projects, people"
          aria-label="Search this workspace"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listId : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[color-mix(in_srgb,var(--sp-text)_62%,transparent)]"
        />
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-[70vh] w-full overflow-y-auto border border-(--sp-neutral-300) bg-(--sp-bg) shadow-lg"
        >
          {isLoading ? (
            <p className="px-3 py-3 text-[12px] text-muted-foreground">
              Searching…
            </p>
          ) : total === 0 ? (
            <p className="px-3 py-3 text-[12px] text-muted-foreground">
              No results for “{query.trim()}”.
            </p>
          ) : (
            <>
              {results.issues.length > 0 ? (
                <Section title="Issues">
                  {results.issues.map((issue) => (
                    <ResultButton key={issue.id} onSelect={() => go(issue.href)}>
                      <span className="sp-mono-key shrink-0 text-[10px] text-(--sp-neutral-600)">
                        {issue.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {issue.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {issue.projectName} · {issue.columnName}
                      </span>
                    </ResultButton>
                  ))}
                </Section>
              ) : null}

              {results.projects.length > 0 ? (
                <Section title="Projects">
                  {results.projects.map((project) => (
                    <ResultButton
                      key={project.id}
                      onSelect={() => go(project.href)}
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {project.name}
                      </span>
                      <span className="sp-mono-key shrink-0 text-[10px] text-(--sp-neutral-600)">
                        {project.key}
                      </span>
                    </ResultButton>
                  ))}
                </Section>
              ) : null}

              {results.members.length > 0 ? (
                <Section title="Members">
                  {results.members.map((member) => (
                    <ResultButton
                      key={member.user.id}
                      onSelect={() => go(workspacePath(workspaceSlug, "team"))}
                    >
                      <UserAvatar user={member.user} size="sm" />
                      <span className="min-w-0 flex-1 truncate">
                        {member.user.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {member.role}
                      </span>
                    </ResultButton>
                  ))}
                </Section>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="border-b border-(--sp-neutral-300) last:border-b-0">
      <p className="sp-kicker px-3 pt-2 pb-1 text-[10px] tracking-[0.1em]">
        {title}
      </p>
      {children}
    </div>
  );
}

function ResultButton({
  onSelect,
  children,
}: {
  readonly onSelect: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={false}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] outline-none transition-colors",
        "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]",
        "focus-visible:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]"
      )}
    >
      {children}
    </button>
  );
}
