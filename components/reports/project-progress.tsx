import type { ProjectProgressDTO } from "@/types/dto";

interface ProjectProgressPanelProps {
  readonly projects: readonly ProjectProgressDTO[];
}

export function ProjectProgressPanel({ projects }: ProjectProgressPanelProps) {
  return (
    <section aria-labelledby="progress-heading" className="sp-panel p-4 lg:p-5">
      <h2 id="progress-heading" className="sp-kicker mb-4 text-[13px]">
        Progress by project
      </h2>

      {projects.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
          No projects in this workspace yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => {
            const percent =
              project.total === 0
                ? 0
                : Math.round((project.completed / project.total) * 100);

            return (
              <li key={project.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {project.name}
                  </span>
                  <span className="shrink-0 text-[12px] tabular-nums text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
                    {project.total === 0 ? (
                      "no issues"
                    ) : (
                      <>
                        {percent}%
                        <span className="sr-only">
                          {" "}
                          — {project.completed} of {project.total} issues done
                        </span>
                      </>
                    )}
                  </span>
                </div>

                <div aria-hidden className="h-1.5 w-full bg-(--sp-neutral-200)">
                  <div
                    className="h-full"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
