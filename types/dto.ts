import type {
  ActivityType,
  InvitationStatus,
  IssueType,
  NotificationType,
  ProjectStatus,
  SprintStatus,
  TaskPriority,
  WorkspaceRole,
} from "@/lib/generated/prisma/enums";
import type { Paginated } from "@/types/api";

export interface UserDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
}

export interface WorkspaceMemberDTO {
  readonly user: UserDTO;
  readonly role: WorkspaceRole;
  readonly joinedAt: string;
}

export interface WorkspaceDTO {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly role: WorkspaceRole;
  readonly memberCount: number;
  readonly projectCount: number;
  readonly createdAt: string;
}

export interface ProjectDTO {
  readonly id: string;
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly slug: string;
  readonly name: string;
  readonly key: string;
  readonly description: string | null;
  readonly color: string;
  readonly status: ProjectStatus;
  readonly createdBy: UserDTO;
  readonly memberCount: number;
  readonly taskCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LabelDTO {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

export interface SubtaskProgressDTO {
  readonly completed: number;
  readonly total: number;
}

export interface TaskCardDTO {
  readonly id: string;
  readonly columnId: string;
  readonly key: string;
  readonly type: IssueType;
  readonly storyPoints: number | null;
  readonly title: string;
  readonly priority: TaskPriority;
  readonly position: number;
  readonly dueDate: string | null;
  readonly assignees: readonly UserDTO[];
  readonly labels: readonly LabelDTO[];
  readonly subtasks: SubtaskProgressDTO;
  readonly commentCount: number;
  readonly hasDescription: boolean;
  readonly sprintId: string | null;
  readonly sprintName: string | null;
}

export interface WorkspaceIssueDTO extends TaskCardDTO {
  readonly projectId: string;
  readonly projectKey: string;
  readonly projectName: string;
  readonly columnName: string;
  readonly isDone: boolean;
  readonly updatedAt: string;
}

export interface BoardColumnDTO {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly isDone: boolean;
  readonly tasks: readonly TaskCardDTO[];
}

export interface BoardDTO {
  readonly projectId: string;
  readonly columns: readonly BoardColumnDTO[];
  readonly sprintNumber: number | null;
}

export interface TaskDetailDTO {
  readonly id: string;
  readonly projectId: string;
  readonly columnId: string;
  readonly key: string;
  readonly type: IssueType;
  readonly storyPoints: number | null;
  readonly column: { readonly id: string; readonly name: string; readonly isDone: boolean };
  readonly title: string;
  readonly description: string | null;
  readonly priority: TaskPriority;
  readonly dueDate: string | null;
  readonly createdBy: UserDTO;
  readonly assignees: readonly UserDTO[];
  readonly labels: readonly LabelDTO[];
  readonly subtasks: SubtaskProgressDTO;
  readonly commentCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SubtaskDTO {
  readonly id: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly position: number;
  readonly assignee: UserDTO | null;
  readonly dueDate: string | null;
}

export interface CommentDTO {
  readonly id: string;
  readonly body: string;
  readonly author: UserDTO;
  readonly createdAt: string;
  readonly editedAt: string | null;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
}

export interface ActivityEntryDTO {
  readonly id: string;
  readonly type: ActivityType;
  readonly actor: UserDTO;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly project?: { readonly id: string; readonly name: string } | null;
}

export interface TaskDetailBundle {
  readonly task: TaskDetailDTO;
  readonly canEdit: boolean;
  readonly currentUserId: string;
  readonly members: readonly UserDTO[];
  readonly subtasks: readonly SubtaskDTO[];
  readonly comments: Paginated<CommentDTO>;
  readonly activity: Paginated<ActivityEntryDTO>;
}

export interface NotificationDTO {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string | null;
  readonly actor: UserDTO | null;
  readonly isRead: boolean;
  readonly createdAt: string;
  readonly href: string | null;
}

export interface MyTaskDTO {
  readonly id: string;
  readonly title: string;
  readonly priority: TaskPriority;
  readonly dueDate: string | null;
  readonly columnName: string;
  readonly project: {
    readonly id: string;
    readonly name: string;
    readonly color: string;
    readonly slug: string;
  };
}

export interface DashboardStatsDTO {
  readonly totalProjects: number;
  readonly activeProjects: number;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly overdueTasks: number;
  readonly myOpenTasks: number;
}

export interface PriorityBreakdownDTO {
  readonly priority: TaskPriority;
  readonly count: number;
}

export interface DashboardDTO {
  readonly stats: DashboardStatsDTO;
  readonly byPriority: readonly PriorityBreakdownDTO[];
  readonly myTasks: readonly MyTaskDTO[];
  readonly recentActivity: readonly ActivityEntryDTO[];
}

export interface ThroughputPointDTO {
  readonly date: string;
  readonly created: number;
  readonly completed: number;
}

export interface WorkloadRowDTO {
  readonly user: UserDTO | null;
  readonly open: number;
  readonly overdue: number;
  readonly urgent: number;
}

export interface SprintOutcomeDTO {
  readonly id: string;
  readonly name: string;
  readonly projectKey: string;
  readonly status: SprintStatus;
  readonly startDate: string;
  readonly endDate: string;
  readonly total: number;
  readonly completed: number;
  readonly points: number;
  readonly completedPoints: number;
}

export interface ProjectProgressDTO {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly color: string;
  readonly total: number;
  readonly completed: number;
}

export interface AgeingIssueDTO {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly priority: TaskPriority;
  readonly ageDays: number;
  readonly dueDate: string | null;
  readonly assignee: UserDTO | null;
}

export interface ReportsDTO {
  readonly rangeDays: number;
  readonly throughput: readonly ThroughputPointDTO[];
  readonly createdTotal: number;
  readonly completedTotal: number;
  readonly workload: readonly WorkloadRowDTO[];
  readonly sprints: readonly SprintOutcomeDTO[];
  readonly projects: readonly ProjectProgressDTO[];
  readonly openByType: readonly { readonly type: IssueType; readonly count: number }[];
  readonly ageing: readonly AgeingIssueDTO[];
}

export interface SprintDTO {
  readonly id: string;
  readonly projectId: string;
  readonly number: number;
  readonly name: string;
  readonly goal: string | null;
  readonly status: SprintStatus;
  readonly startDate: string;
  readonly endDate: string;
  readonly taskCount: number;
  readonly completedCount: number;
}

export interface InviteMemberResultDTO {
  readonly invitation: InvitationDTO;
  readonly emailSent: boolean;
  readonly invitationUrl: string;
}

export interface InvitationDTO {
  readonly id: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly status: InvitationStatus;
  readonly invitedBy: UserDTO;
  readonly expiresAt: string;
  readonly createdAt: string;
}
