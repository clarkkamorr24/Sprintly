import type { WorkspaceRole } from "@/lib/generated/prisma/enums";

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly hasOnboarded: boolean;
}

export interface WorkspaceContext {
  readonly user: SessionUser;
  readonly workspaceId: string;
  readonly role: WorkspaceRole;
}

export interface ProjectContext extends WorkspaceContext {
  readonly projectId: string;
  readonly isProjectMember: boolean;
}

export interface AuthProvider {
  getCurrentUser(): Promise<SessionUser | null>;
}
