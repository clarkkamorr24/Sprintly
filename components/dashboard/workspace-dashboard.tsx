import { MyTasks } from "@/components/dashboard/my-tasks";
import { PriorityBreakdown } from "@/components/dashboard/priority-breakdown";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import type { DashboardDTO } from "@/types/dto";

interface WorkspaceDashboardProps {
  readonly dashboard: DashboardDTO;
}

export function WorkspaceDashboard({ dashboard }: WorkspaceDashboardProps) {
  const { stats } = dashboard;

  const completionRate = stats.totalTasks
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Projects"
          value={stats.totalProjects}
          hint={`${stats.activeProjects} active`}
        />
        <StatCard label="Active projects" value={stats.activeProjects} />
        <StatCard label="Tasks" value={stats.totalTasks} />
        <StatCard
          label="Completed"
          value={stats.completedTasks}
          hint={stats.totalTasks ? `${completionRate}% of all tasks` : undefined}
        />
        <StatCard
          label="Overdue"
          value={stats.overdueTasks}
          emphasis="warning"
        />
        <StatCard label="Assigned to you" value={stats.myOpenTasks} />
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MyTasks tasks={dashboard.myTasks} total={stats.myOpenTasks} />
        </div>
        <PriorityBreakdown items={dashboard.byPriority} />
      </div>

      <RecentActivity entries={dashboard.recentActivity} />
    </div>
  );
}
