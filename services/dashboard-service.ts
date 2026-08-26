import "server-only";

import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { ProjectStatus, TaskPriority } from "@/lib/generated/prisma/enums";
import * as repo from "@/repositories/dashboard-repository";
import type {
  ActivityEntryDTO,
  DashboardDTO,
  MyTaskDTO,
  PriorityBreakdownDTO,
} from "@/types/dto";

const MY_TASKS_LIMIT = 6;
const ACTIVITY_LIMIT = 8;

const PRIORITY_ORDER: readonly TaskPriority[] = [
  TaskPriority.URGENT,
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
];

export async function getDashboard(workspaceId: string): Promise<DashboardDTO> {
  const context = await requireWorkspaceAccess(workspaceId);

  const projects = await repo.findAccessibleProjectIds(workspaceId);
  const projectIds = projects.map((p) => p.id);

  const now = new Date();

  const [
    projectsByStatus,
    totalTasks,
    completedTasks,
    overdueTasks,
    priorityGroups,
    myOpenTasks,
    myTasks,
    activity,
  ] = await Promise.all([
    repo.countProjectsByStatus(workspaceId),
    repo.countTasks(projectIds),
    repo.countCompletedTasks(projectIds),
    repo.countOverdueTasks(projectIds, now),
    repo.countTasksByPriority(projectIds),
    repo.countMyOpenTasks(projectIds, context.user.id),
    repo.findMyOpenTasks({
      projectIds,
      userId: context.user.id,
      take: MY_TASKS_LIMIT,
    }),
    repo.findRecentActivity(workspaceId, ACTIVITY_LIMIT),
  ]);

  const totalProjects = projectsByStatus.reduce(
    (sum, group) => sum + group._count._all,
    0
  );
  const activeProjects =
    projectsByStatus.find((g) => g.status === ProjectStatus.ACTIVE)?._count
      ._all ?? 0;

  const priorityCounts = new Map(
    priorityGroups.map((group) => [group.priority, group._count._all])
  );

  const byPriority: readonly PriorityBreakdownDTO[] = PRIORITY_ORDER.map(
    (priority) => ({
      priority,
      count: priorityCounts.get(priority) ?? 0,
    })
  );

  return {
    stats: {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      myOpenTasks,
    },
    byPriority,
    myTasks: myTasks.map<MyTaskDTO>((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      columnName: task.column.name,
      project: task.project,
    })),
    recentActivity: activity.map<ActivityEntryDTO>((entry) => ({
      id: entry.id,
      type: entry.type,
      actor: entry.actor,
      metadata: (entry.metadata ?? {}) as Record<string, unknown>,
      createdAt: entry.createdAt.toISOString(),
      project: entry.project,
    })),
  };
}
