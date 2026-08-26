import type {
  ActivityType,
  NotificationType,
  ProjectStatus,
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
  readonly name: string;
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
  readonly title: string;
  readonly priority: TaskPriority;
  readonly position: number;
  readonly dueDate: string | null;
  readonly assignees: readonly UserDTO[];
  readonly labels: readonly LabelDTO[];
  readonly subtasks: SubtaskProgressDTO;
  readonly commentCount: number;
  readonly hasDescription: boolean;
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
}

export interface TaskDetailDTO {
  readonly id: string;
  readonly projectId: string;
  readonly columnId: string;
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
}

export interface TaskDetailBundle {
  readonly task: TaskDetailDTO;
  readonly canEdit: boolean;
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
