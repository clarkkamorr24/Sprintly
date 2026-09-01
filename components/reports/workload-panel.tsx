import { InitialsTile } from "@/components/shared/initials-tile";
import type { WorkloadRowDTO } from "@/types/dto";

interface WorkloadPanelProps {
  readonly rows: readonly WorkloadRowDTO[];
}

export function WorkloadPanel({ rows }: WorkloadPanelProps) {
  const peak = Math.max(1, ...rows.map((row) => row.open));

  return (
    <section aria-labelledby="workload-heading" className="sp-panel p-4 lg:p-5">
      <h2 id="workload-heading" className="sp-kicker mb-4 text-[13px]">
        Open issues by assignee
      </h2>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
          No open issues in this workspace.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.user?.id ?? "unassigned"} className="space-y-1.5">
              <div className="flex items-center gap-2">
                {row.user ? (
                  <InitialsTile user={row.user} size="xs" />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-[22px] shrink-0 items-center justify-center border border-dashed border-(--sp-neutral-400) text-[10px]"
                  >
                    ?
                  </span>
                )}

                <span className="min-w-0 flex-1 truncate text-[13px]">
                  {row.user?.name ?? "Unassigned"}
                </span>

                {row.urgent > 0 ? (
                  <span className="shrink-0 text-[11px] text-(--sp-accent-700)">
                    {row.urgent} urgent
                  </span>
                ) : null}
                {row.overdue > 0 ? (
                  <span className="shrink-0 text-[11px] text-(--sp-accent-700)">
                    {row.overdue} overdue
                  </span>
                ) : null}

                <span className="w-6 shrink-0 text-right text-[13px] font-extrabold tabular-nums">
                  {row.open}
                </span>
              </div>

              <div aria-hidden className="h-1.5 w-full bg-(--sp-neutral-200)">
                <div
                  className={
                    row.user ? "h-full bg-(--sp-accent)" : "h-full bg-(--sp-neutral-400)"
                  }
                  style={{ width: `${(row.open / peak) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
