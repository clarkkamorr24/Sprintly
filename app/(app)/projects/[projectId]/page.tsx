import type { Metadata } from "next";
import Link from "next/link";

import { BoardView } from "@/components/board/board-view";
import { EmptyState } from "@/components/shared/empty-state";
import { requireProjectAccess } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { loadPage } from "@/lib/page-guard";
import { getBoard, getBoardMeta } from "@/services/board-service";
import { getProject } from "@/services/project-service";

export async function generateMetadata(
  props: PageProps<"/projects/[projectId]">
): Promise<Metadata> {
  const { projectId } = await props.params;

  try {
    const project = await getProject(projectId);
    return { title: `${project.name} · Sprintly` };
  } catch {
    return { title: "Project · Sprintly" };
  }
}

export default async function ProjectBoardPage(
  props: PageProps<"/projects/[projectId]">
) {
  const { projectId } = await props.params;

  const [context, project, board, meta] = await loadPage(() =>
    Promise.all([
      requireProjectAccess(projectId),
      getProject(projectId),
      getBoard(projectId),
      getBoardMeta(projectId),
    ])
  );

  const hasTasks = board.columns.some((column) => column.tasks.length > 0);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <Link
              href={`/workspaces/${project.workspaceId}`}
              className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Projects
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
          </div>
          {project.description ? (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl">
        {board.columns.length === 0 ? (
          <EmptyState
            title="This board has no columns"
            description="Add a column to start organising work."
          />
        ) : (
          <>
            {!hasTasks ? (
              <p className="mb-4 text-sm text-muted-foreground">
                This board is empty. Add your first task to a column below.
              </p>
            ) : null}
            <BoardView
              projectId={projectId}
              columns={board.columns}
              members={meta.members}
              canCreateTask={can(context.role, PERMISSIONS.TASK_CREATE)}
            />
          </>
        )}
      </div>
    </main>
  );
}
