import type {
  ProjectStatus,
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
