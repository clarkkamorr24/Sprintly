import type { Metadata } from "next";

import { AgeingList } from "@/components/reports/ageing-list";
import { ProjectProgressPanel } from "@/components/reports/project-progress";
import { RangeFilter } from "@/components/reports/range-filter";
import { SprintOutcomes } from "@/components/reports/sprint-outcomes";
import { ThroughputChart } from "@/components/reports/throughput-chart";
import { WorkloadPanel } from "@/components/reports/workload-panel";
import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { ISSUE_TYPE_LABEL } from "@/lib/issue-display";
import { loadPage } from "@/lib/page-guard";
import { reportRangeSchema } from "@/schemas/report";
import { getReports } from "@/services/report-service";

export const metadata: Metadata = {
  title: "Reports · Sprintly",
};

function single(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

export default async function WorkspaceReportsPage(
  props: PageProps<"/[workspaceSlug]/projects/[projectSlug]/reports">
) {
  const { workspaceSlug, projectSlug } = await props.params;
  const searchParams = await props.searchParams;

  const rangeDays = reportRangeSchema.parse(single(searchParams.range) ?? 30);

  const reports = await loadPage(async () => {
    const context = await requireWorkspaceBySlug(workspaceSlug);
    return getReports(context.workspaceId, rangeDays);
  });

  const openTotal = reports.openByType.reduce((sum, row) => sum + row.count, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-8 lg:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1>Reports</h1>
          <p className="text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
            Delivery trends across this workspace.
          </p>
        </div>

        <RangeFilter active={reports.rangeDays} />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Created" value={reports.createdTotal} hint={`last ${reports.rangeDays} days`} />
        <Stat label="Completed" value={reports.completedTotal} hint={`last ${reports.rangeDays} days`} />
        <Stat label="Open now" value={openTotal} hint="across all projects" />
        <Stat
          label="Oldest open"
          value={reports.ageing[0]?.ageDays ?? 0}
          hint={reports.ageing.length > 0 ? "days" : "nothing open"}
        />
      </div>

      <ThroughputChart
        points={reports.throughput}
        created={reports.createdTotal}
        completed={reports.completedTotal}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <WorkloadPanel rows={reports.workload} />
        <SprintOutcomes sprints={reports.sprints} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectProgressPanel projects={reports.projects} />

        <section aria-labelledby="type-heading" className="sp-panel p-4 lg:p-5">
          <h2 id="type-heading" className="sp-kicker mb-4 text-[13px]">
            Open issues by type
          </h2>

          {openTotal === 0 ? (
            <p className="py-6 text-center text-sm text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
              No open issues in this workspace.
            </p>
          ) : (
            <dl className="space-y-3">
              {reports.openByType.map((row) => {
                const percent = Math.round((row.count / openTotal) * 100);

                return (
                  <div key={row.type} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <dt>{ISSUE_TYPE_LABEL[row.type]}</dt>
                      <dd className="tabular-nums text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
                        {row.count}
                        <span className="sr-only">
                          {" "}
                          of {openTotal} open issues ({percent}%)
                        </span>
                      </dd>
                    </div>
                    <div aria-hidden className="h-1.5 w-full bg-(--sp-neutral-200)">
                      <div
                        className="h-full bg-(--sp-neutral-800)"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </dl>
          )}
        </section>
      </div>

      <AgeingList issues={reports.ageing} />
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: number;
  readonly hint: string;
}) {
  return (
    <div className="sp-panel p-4">
      <p className="sp-kicker text-[10px]">{label}</p>
      <p className="mt-1 text-[28px] leading-none font-extrabold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)]">
        {hint}
      </p>
    </div>
  );
}
