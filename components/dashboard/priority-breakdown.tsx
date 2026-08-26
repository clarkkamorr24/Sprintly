import { TaskPriority } from "@/lib/generated/prisma/enums";
import { PRIORITY_LABEL } from "@/lib/task-display";
import type { PriorityBreakdownDTO } from "@/types/dto";

const BAR_COLOR: Readonly<Record<TaskPriority, string>> = {
  [TaskPriority.URGENT]: "bg-red-500",
  [TaskPriority.HIGH]: "bg-amber-500",
  [TaskPriority.MEDIUM]: "bg-sky-500",
  [TaskPriority.LOW]: "bg-slate-400",
};

interface PriorityBreakdownProps {
  readonly items: readonly PriorityBreakdownDTO[];
}

export function PriorityBreakdown({ items }: PriorityBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Open tasks by priority</h2>

      {total === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No open tasks in this workspace.
        </p>
      ) : (
        <dl className="mt-3 space-y-2.5">
          {items.map((item) => {
            const percent = total ? Math.round((item.count / total) * 100) : 0;

            return (
              <div key={item.priority} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <dt>{PRIORITY_LABEL[item.priority]}</dt>
                  <dd className="tabular-nums text-muted-foreground">
                    {item.count}
                    <span className="sr-only">
                      {" "}
                      of {total} open tasks ({percent}%)
                    </span>
                  </dd>
                </div>
                <div
                  aria-hidden
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={`h-full rounded-full ${BAR_COLOR[item.priority]}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
