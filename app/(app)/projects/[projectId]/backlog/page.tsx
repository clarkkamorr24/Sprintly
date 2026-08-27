import type { Metadata } from "next";
import Link from "next/link";

import { BacklogView } from "@/components/backlog/backlog-view";
import { requireProjectAccess } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { getBacklog, getBoard, getBoardMeta } from "@/services/board-service";
import { getProject } from "@/services/project-service";

export async function generateMetadata(
  props: PageProps<"/projects/[projectId]/backlog">
): Promise<Metadata> {
  const { projectId } = await props.params;

  try {
    const project = await getProject(projectId);
    return { title: `Backlog · ${project.name} · Sprintly` };
  } catch {
    return { title: "Backlog · Sprintly" };
  }
}

export default async function BacklogPage(
  props: PageProps<"/projects/[projectId]/backlog">
) {
  const { projectId } = await props.params;

  const [context, project, groups, board, meta] = await loadPage(() =>
    Promise.all([
      requireProjectAccess(projectId),
      getProject(projectId),
      getBacklog(projectId),
      getBoard(projectId),
      getBoardMeta(projectId),
    ])
  );

  const columnNames = new Map(
    board.columns.map((column) => [column.id, column.name])
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 lg:px-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="sp-kicker mb-1.5">
            <Link
              href={`/projects/${projectId}`}
              className="outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {project.name}
            </Link>{" "}
            / Backlog
          </nav>
          <h1 className="text-[32px]">Backlog</h1>
        </div>
      </header>

      <BacklogView
        projectId={projectId}
        groups={groups}
        columnNames={Object.fromEntries(columnNames)}
        members={meta.members}
        canManageSprints={can(context.role, PERMISSIONS.BOARD_MANAGE)}
        canCreateTask={can(context.role, PERMISSIONS.TASK_CREATE)}
        canComment={can(context.role, PERMISSIONS.COMMENT_CREATE)}
        defaultColumnId={board.columns[0]?.id ?? ""}
      />
    </main>
  );
}
