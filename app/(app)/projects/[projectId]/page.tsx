import type { Metadata } from "next";
import Link from "next/link";

import { BoardFilters } from "@/components/board/board-filters";
import { BoardView } from "@/components/board/board-view";
import { EmptyState } from "@/components/shared/empty-state";
import { SprintBanner } from "@/components/sprint/sprint-banner";
import { requireProjectAccess } from "@/lib/auth/guards";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import { loadPage } from "@/lib/page-guard";
import { boardFiltersSchema } from "@/schemas/task";
import { getBoard, getBoardMeta } from "@/services/board-service";
import { getProject } from "@/services/project-service";
import { listSprints } from "@/services/sprint-service";

function single(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

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
  const searchParams = await props.searchParams;

  const filters = boardFiltersSchema.parse({
    search: single(searchParams.search),
    assigneeId: single(searchParams.assigneeId),
    priority: single(searchParams.priority),
    labelId: single(searchParams.labelId),
    due: single(searchParams.due),
  });

  const [context, project, board, meta, sprints] = await loadPage(() =>
    Promise.all([
      requireProjectAccess(projectId),
      getProject(projectId),
      getBoard(projectId, filters),
      getBoardMeta(projectId),
      listSprints(projectId),
    ])
  );

  const allTasks = board.columns.flatMap((column) => column.tasks);
  const taskCount = allTasks.length;
  const hasFilters = Object.values(filters).some(Boolean);

  const activeSprint =
    sprints.find((sprint) => sprint.status === SprintStatus.ACTIVE) ?? null;

  const sprintTasks = activeSprint
    ? allTasks.filter((task) => task.sprintId === activeSprint.id)
    : [];
  const doneColumnIds = new Set(
    board.columns.filter((column) => column.isDone).map((column) => column.id)
  );

  const totalPoints = sprintTasks.reduce(
    (sum, task) => sum + (task.storyPoints ?? 0),
    0
  );
  const completedPoints = sprintTasks
    .filter((task) => doneColumnIds.has(task.columnId))
    .reduce((sum, task) => sum + (task.storyPoints ?? 0), 0);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-(--sp-neutral-300) px-4 pt-5 pb-4 lg:px-6">
        <nav aria-label="Breadcrumb" className="sp-kicker mb-1.5">
          <Link
            href={`/workspaces/${project.workspaceId}`}
            className="rounded-none outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {project.name}
          </Link>{" "}
          / Board
        </nav>

        {activeSprint ? (
          <SprintBanner
            sprint={activeSprint}
            totalPoints={totalPoints}
            completedPoints={completedPoints}
          />
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-[32px]">{project.name}</h1>
              {project.description ? (
                <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--sp-text)_65%,transparent)]">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {board.columns.length === 0 ? (
        <div className="p-4 lg:p-6">
          <EmptyState
            title="This board has no columns"
            description="Add a column to start organising work."
          />
        </div>
      ) : (
        <>
          <div className="border-b border-(--sp-neutral-300) px-4 py-3 lg:px-6">
            <BoardFilters
              projectId={projectId}
              members={meta.members}
              labels={meta.labels}
              resultCount={taskCount}
            />
          </div>

          {taskCount === 0 && !hasFilters ? (
            <p className="px-4 pt-4 text-sm text-[color-mix(in_srgb,var(--sp-text)_55%,transparent)] lg:px-6">
              This board is empty. Add your first issue to a column below.
            </p>
          ) : null}

          <BoardView
            projectId={projectId}
            columns={board.columns}
            sprints={sprints}
            members={meta.members}
            canCreateTask={can(context.role, PERMISSIONS.TASK_CREATE)}
            canComment={can(context.role, PERMISSIONS.COMMENT_CREATE)}
            currentUserId={context.user.id}
          />
        </>
      )}
    </main>
  );
}
