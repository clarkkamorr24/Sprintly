import type { Metadata } from "next";

import { IssueFilters } from "@/components/issues/issue-filters";
import { IssueList } from "@/components/issues/issue-list";
import { Pagination } from "@/components/shared/pagination";
import { requireWorkspaceBySlug } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { workspaceIssueFiltersSchema } from "@/schemas/task";
import { listWorkspaceIssues } from "@/services/board-service";
import { listProjects } from "@/services/project-service";

export const metadata: Metadata = {
  title: "Issues · Sprintly",
};

function single(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

export default async function WorkspaceIssuesPage(
  props: PageProps<"/[workspaceSlug]/projects/[projectSlug]/issues">
) {
  const { workspaceSlug, projectSlug } = await props.params;
  const searchParams = await props.searchParams;

  const filters = workspaceIssueFiltersSchema.parse({
    search: single(searchParams.search),
    assigneeId: single(searchParams.assigneeId),
    type: single(searchParams.type),
    priority: single(searchParams.priority),
    projectId: single(searchParams.projectId),
    status: single(searchParams.status),
    page: single(searchParams.page) ?? 1,
  });

  const { context, issues, projects } = await loadPage(async () => {
    const context = await requireWorkspaceBySlug(workspaceSlug);

    const [issues, projects] = await Promise.all([
      listWorkspaceIssues(context.workspaceId, filters),
      listProjects({ workspaceId: context.workspaceId }),
    ]);

    return { context, issues, projects };
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-8 lg:px-6">
      <header className="space-y-1">
        <h1>Issues</h1>
        <p className="text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
          {issues.total} {issues.total === 1 ? "issue" : "issues"} across this
          workspace.
        </p>
      </header>

      <IssueFilters projects={projects} resultCount={issues.total} />

      <IssueList
        issues={issues.items}
        canComment={can(context.role, PERMISSIONS.COMMENT_CREATE)}
      />

      <Pagination
        page={issues.page}
        pageSize={issues.pageSize}
        total={issues.total}
      />
    </main>
  );
}
