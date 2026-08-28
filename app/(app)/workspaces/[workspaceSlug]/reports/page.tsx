import type { Metadata } from "next";
import Link from "next/link";

import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { loadPage } from "@/lib/page-guard";

export const metadata: Metadata = {
  title: "Reports · Sprintly",
};

export default async function WorkspaceReportsPage(
  props: PageProps<"/workspaces/[workspaceSlug]/reports">
) {
  const { workspaceSlug } = await props.params;

  await loadPage(() => requireWorkspaceBySlug(workspaceSlug));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 lg:px-6">
      <header className="space-y-1">
        <h1 className="text-[32px]">Reports</h1>
        <p className="text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
          Velocity, burndown, and throughput reporting for this workspace.
        </p>
      </header>

      <div className="sp-panel p-6">
        <p className="sp-kicker mb-2">Not built yet</p>
        <p className="text-sm text-[color-mix(in_srgb,var(--sp-text)_70%,transparent)]">
          This page is a placeholder. The sprint and issue data it would draw
          from already exists, but no reports have been designed yet, so nothing
          is shown here rather than charts that do not mean anything.
        </p>
        <p className="mt-4 text-sm">
          In the meantime,{" "}
          <Link
            href={`/workspaces/${workspaceSlug}`}
            className="text-(--sp-accent) underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            the dashboard
          </Link>{" "}
          shows workspace totals, and{" "}
          <Link
            href={`/workspaces/${workspaceSlug}/sprints`}
            className="text-(--sp-accent) underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            sprint planning
          </Link>{" "}
          shows committed points per sprint.
        </p>
      </div>
    </main>
  );
}
