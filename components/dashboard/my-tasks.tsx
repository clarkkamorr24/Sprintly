import { OpenProjectLink } from "@/components/project/open-project-link";

import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/task-display";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";
import type { MyTaskDTO } from "@/types/dto";

interface MyTasksProps {
  readonly tasks: readonly MyTaskDTO[];
  readonly total: number;
  readonly workspaceSlug: string;
}

export function MyTasks({ tasks, total, workspaceSlug }: MyTasksProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Assigned to you</h2>
        {total > tasks.length ? (
          <p className="text-xs text-muted-foreground">
            {tasks.length} of {total}
          </p>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing assigned to you right now.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate);

            return (
              <li key={task.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />

                  <div className="min-w-0 flex-1">
                    <OpenProjectLink
                      projectSlug={task.project.slug}
                      workspaceSlug={workspaceSlug}
                      className="rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {task.title}
                    </OpenProjectLink>

                    <p className="text-xs text-muted-foreground">
                      {task.project.name} · {task.columnName}
                      {task.dueDate ? (
                        <>
                          {" · "}
                          <span className={cn(overdue && "text-destructive")}>
                            {formatDueDate(task.dueDate)}
                            {overdue ? (
                              <span className="sr-only"> (overdue)</span>
                            ) : null}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn("shrink-0", PRIORITY_STYLE[task.priority])}
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
