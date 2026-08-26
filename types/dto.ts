import type {
  ProjectStatus,
  TaskPriority,
  WorkspaceRole,
} from "@/lib/generated/prisma/enums";

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
