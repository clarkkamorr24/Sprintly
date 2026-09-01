import "server-only";

import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { TaskPriority } from "@/lib/generated/prisma/enums";
import * as repo from "@/repositories/report-repository";
import type {
  AgeingIssueDTO,
  ProjectProgressDTO,
  ReportsDTO,
  SprintOutcomeDTO,
  ThroughputPointDTO,
  WorkloadRowDTO,
} from "@/types/dto";

const AGEING_LIMIT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function buildThroughput(
  created: readonly { createdAt: Date }[],
  completed: readonly { completedAt: Date | null }[],
  rangeDays: number
): readonly ThroughputPointDTO[] {
  const createdByDay = new Map<string, number>();
  const completedByDay = new Map<string, number>();

  for (const task of created) {
    const key = dayKey(task.createdAt);
    createdByDay.set(key, (createdByDay.get(key) ?? 0) + 1);
  }

  for (const task of completed) {
    if (!task.completedAt) continue;
    const key = dayKey(task.completedAt);
    completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
  }

  const today = startOfDay(new Date());
  const points: ThroughputPointDTO[] = [];

  for (let offset = rangeDays - 1; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * DAY_MS);
    const key = dayKey(day);

    points.push({
      date: key,
      created: createdByDay.get(key) ?? 0,
      completed: completedByDay.get(key) ?? 0,
    });
  }

  return points;
}

export async function getReports(
  workspaceId: string,
  rangeDays: number
): Promise<ReportsDTO> {
  await requireWorkspaceAccess(workspaceId);

  const since = new Date(
    startOfDay(new Date()).getTime() - (rangeDays - 1) * DAY_MS
  );

  const [created, completed, assignments, unassigned, sprints, projects, byType, ageing] =
    await Promise.all([
      repo.countCreatedSince(workspaceId, since),
      repo.countCompletedSince(workspaceId, since),
      repo.findWorkloadByAssignee(workspaceId),
      repo.findUnassignedOpenCount(workspaceId),
      repo.findSprintOutcomes(workspaceId),
      repo.findProjectProgress(workspaceId),
      repo.countOpenByType(workspaceId),
      repo.findAgeingOpenTasks(workspaceId, AGEING_LIMIT),
    ]);

  const now = new Date();

  const workloadByUser = new Map<string, WorkloadRowDTO>();

  for (const assignment of assignments) {
    const existing = workloadByUser.get(assignment.user.id) ?? {
      user: assignment.user,
      open: 0,
      overdue: 0,
      urgent: 0,
    };

    workloadByUser.set(assignment.user.id, {
      user: assignment.user,
      open: existing.open + 1,
      overdue:
        existing.overdue +
        (assignment.task.dueDate && assignment.task.dueDate < now ? 1 : 0),
      urgent:
        existing.urgent +
        (assignment.task.priority === TaskPriority.URGENT ? 1 : 0),
    });
  }

  const workload: WorkloadRowDTO[] = [...workloadByUser.values()].sort(
    (a, b) => b.open - a.open
  );

  if (unassigned > 0) {
    workload.push({ user: null, open: unassigned, overdue: 0, urgent: 0 });
  }

  const sprintOutcomes: readonly SprintOutcomeDTO[] = sprints.map((sprint) => ({
    id: sprint.id,
    name: sprint.name,
    projectKey: sprint.project.key,
    status: sprint.status,
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    total: sprint.tasks.length,
    completed: sprint.tasks.filter((task) => task.completedAt !== null).length,
    points: sprint.tasks.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
    completedPoints: sprint.tasks
      .filter((task) => task.completedAt !== null)
      .reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
  }));

  const projectProgress: readonly ProjectProgressDTO[] = projects.map(
    (project) => ({
      id: project.id,
      name: project.name,
      key: project.key,
      color: project.color,
      total: project.tasks.length,
      completed: project.tasks.filter((task) => task.completedAt !== null)
        .length,
    })
  );

  const ageingIssues: readonly AgeingIssueDTO[] = ageing.map((task) => ({
    id: task.id,
    key: `${task.project.key}-${task.number}`,
    title: task.title,
    priority: task.priority,
    ageDays: Math.max(
      0,
      Math.floor((now.getTime() - task.createdAt.getTime()) / DAY_MS)
    ),
    dueDate: task.dueDate?.toISOString() ?? null,
    assignee: task.assignees[0]?.user ?? null,
  }));

  return {
    rangeDays,
    throughput: buildThroughput(created, completed, rangeDays),
    createdTotal: created.length,
    completedTotal: completed.length,
    workload,
    sprints: sprintOutcomes,
    projects: projectProgress,
    openByType: byType.map((row) => ({
      type: row.type,
      count: row._count._all,
    })),
    ageing: ageingIssues,
  };
}
