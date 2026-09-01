import type { ThroughputPointDTO } from "@/types/dto";

interface ThroughputChartProps {
  readonly points: readonly ThroughputPointDTO[];
  readonly created: number;
  readonly completed: number;
}

function label(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ThroughputChart({
  points,
  created,
  completed,
}: ThroughputChartProps) {
  const peak = Math.max(1, ...points.map((p) => Math.max(p.created, p.completed)));
  const net = completed - created;

  return (
    <section aria-labelledby="throughput-heading" className="sp-panel p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="throughput-heading" className="sp-kicker text-[13px]">
          Created vs completed
        </h2>
        <p className="text-[12px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
          <span className="font-extrabold text-(--sp-text)">{created}</span>{" "}
          created ·{" "}
          <span className="font-extrabold text-(--sp-text)">{completed}</span>{" "}
          completed
          {net !== 0 ? (
            <> · backlog {net > 0 ? "shrank" : "grew"} by {Math.abs(net)}</>
          ) : null}
        </p>
      </div>

      {created === 0 && completed === 0 ? (
        <p className="py-6 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
          No issues were created or completed in this period.
        </p>
      ) : (
        <>
          <ol className="flex h-[132px] items-end gap-px overflow-x-auto">
            {points.map((point) => (
              <li
                key={point.date}
                className="flex h-full min-w-[6px] flex-1 flex-col justify-end gap-px"
                title={`${label(point.date)}: ${point.created} created, ${point.completed} completed`}
              >
                <span className="sr-only">
                  {label(point.date)}: {point.created} created,{" "}
                  {point.completed} completed
                </span>
                <span
                  aria-hidden
                  className="w-full bg-(--sp-neutral-400)"
                  style={{ height: `${(point.created / peak) * 50}%` }}
                />
                <span
                  aria-hidden
                  className="w-full bg-(--sp-accent)"
                  style={{ height: `${(point.completed / peak) * 50}%` }}
                />
              </li>
            ))}
          </ol>

          <div className="mt-3 flex items-center gap-4 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="block size-2.5 bg-(--sp-neutral-400)" />
              Created
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="block size-2.5 bg-(--sp-accent)" />
              Completed
            </span>
            <span className="ml-auto">
              {label(points[0]?.date ?? "")} – {label(points.at(-1)?.date ?? "")}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
