import type { Metadata } from "next";

import { BoardFilters } from "@/components/board/board-filters";
import { BoardView } from "@/components/board/board-view";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectSwitcher } from "@/components/project/project-switcher";
import { SprintBanner } from "@/components/sprint/sprint-banner";
import { can, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveWorkspaceProjectScope } from "@/lib/auth/workspace-page";
import { SprintStatus } from "@/lib/generated/prisma/enums";
import { loadPage } from "@/lib/page-guard";
import { boardFiltersSchema } from "@/schemas/task";
import { getBoard, getBoardMeta } from "@/services/board-service";
import { listProjects } from "@/services/project-service";
import { listSprints } from "@/services/sprint-service";

export const metadata: Metadata = {
  title: "Board · Sprintly",
};

function single(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

export default async function WorkspaceBoardPage(
  props: PageProps<"/workspaces/[workspaceSlug]/board">
) {
  const { workspaceSlug } = await props.params;
  const searchParams = await props.searchParams;

  const filters = boardFiltersSchema.parse({
    search: single(searchParams.search),
    assigneeId: single(searchParams.assigneeId),
    priority: single(searchParams.priority),
    labelId: single(searchParams.labelId),
    due: single(searchParams.due),
  });

  const { context, project, board, meta, sprints, projects } = await loadPage(
    async () => {
      const scope = await resolveWorkspaceProjectScope(workspaceSlug);

      const [board, meta, sprints, projects] = await Promise.all([
        getBoard(scope.project.id, filters),
        getBoardMeta(scope.project.id),
        listSprints(scope.project.id),
        listProjects({ workspaceId: scope.workspace.workspaceId }),
      ]);

      return {
        context: scope.context,
        project: scope.project,
        board,
        meta,
        sprints,
        projects,
      };
    }
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
        <div className="mb-2">
          <ProjectSwitcher
            projects={projects}
            activeProjectId={project.id}
          />
        </div>

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
            projectId={project.id}
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
