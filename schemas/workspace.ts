import * as z from "zod";

import { WorkspaceRole } from "@/lib/generated/prisma/enums";
import { uuidSchema } from "@/schemas/common";

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(2, { error: "Name must be at least 2 characters." })
  .max(60, { error: "Name must be 60 characters or fewer." });

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  description: z
    .string()
    .trim()
    .max(280, { error: "Description must be 280 characters or fewer." })
    .optional()
    .or(z.literal("")),
});

export const updateWorkspaceSchema = z.object({
  workspaceId: uuidSchema,
  name: workspaceNameSchema,
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

const assignableRoleSchema = z.enum(
  [WorkspaceRole.ADMIN, WorkspaceRole.MEMBER, WorkspaceRole.VIEWER],
  { error: "Choose a valid role." }
);

export const inviteMemberSchema = z.object({
  workspaceId: uuidSchema,
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
  role: assignableRoleSchema,
});

export const updateMemberRoleSchema = z.object({
  workspaceId: uuidSchema,
  userId: uuidSchema,
  role: assignableRoleSchema,
});

export const removeMemberSchema = z.object({
  workspaceId: uuidSchema,
  userId: uuidSchema,
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

export const revokeInvitationSchema = z.object({
  invitationId: uuidSchema,
});

export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;

export const deleteWorkspaceSchema = z.object({
  workspaceId: uuidSchema,
  confirmName: z.string().trim().min(1),
});

export const transferOwnershipSchema = z.object({
  workspaceId: uuidSchema,
  toUserId: uuidSchema,
});

export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
