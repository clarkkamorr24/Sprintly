import { WorkspaceRole } from "@/lib/generated/prisma/enums";

export const PERMISSIONS = {
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_DELETE: "workspace:delete",
  MEMBER_INVITE: "member:invite",
  MEMBER_REMOVE: "member:remove",
  MEMBER_ROLE_UPDATE: "member:role:update",
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  BOARD_MANAGE: "board:manage",
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  COMMENT_CREATE: "comment:create",
  LABEL_MANAGE: "label:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const VIEWER_PERMISSIONS: readonly Permission[] = [];

const MEMBER_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.TASK_CREATE,
  PERMISSIONS.TASK_UPDATE,
  PERMISSIONS.COMMENT_CREATE,
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...MEMBER_PERMISSIONS,
  PERMISSIONS.MEMBER_INVITE,
  PERMISSIONS.MEMBER_REMOVE,
  PERMISSIONS.PROJECT_CREATE,
  PERMISSIONS.PROJECT_UPDATE,
  PERMISSIONS.PROJECT_DELETE,
  PERMISSIONS.BOARD_MANAGE,
  PERMISSIONS.TASK_DELETE,
  PERMISSIONS.LABEL_MANAGE,
];

const OWNER_PERMISSIONS: readonly Permission[] = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.WORKSPACE_UPDATE,
  PERMISSIONS.WORKSPACE_DELETE,
  PERMISSIONS.MEMBER_ROLE_UPDATE,
];

const ROLE_PERMISSIONS: Readonly<Record<WorkspaceRole, readonly Permission[]>> = {
  [WorkspaceRole.OWNER]: OWNER_PERMISSIONS,
  [WorkspaceRole.ADMIN]: ADMIN_PERMISSIONS,
  [WorkspaceRole.MEMBER]: MEMBER_PERMISSIONS,
  [WorkspaceRole.VIEWER]: VIEWER_PERMISSIONS,
};

export function can(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

const ROLE_RANK: Readonly<Record<WorkspaceRole, number>> = {
  [WorkspaceRole.OWNER]: 4,
  [WorkspaceRole.ADMIN]: 3,
  [WorkspaceRole.MEMBER]: 2,
  [WorkspaceRole.VIEWER]: 1,
};

export function hasAtLeastRole(
  role: WorkspaceRole,
  minimum: WorkspaceRole
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canModifyTask(
  role: WorkspaceRole,
  userId: string,
  task: { readonly createdById: string; readonly assigneeIds: readonly string[] }
): boolean {
  if (role === WorkspaceRole.VIEWER) return false;
  if (hasAtLeastRole(role, WorkspaceRole.ADMIN)) return true;
  return task.createdById === userId || task.assigneeIds.includes(userId);
}
