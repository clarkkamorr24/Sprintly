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

export const inviteMemberSchema = z.object({
  workspaceId: uuidSchema,
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER], {
    error: "Choose a valid role.",
  }),
});

export const updateMemberRoleSchema = z.object({
  workspaceId: uuidSchema,
  userId: uuidSchema,
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER], {
    error: "Choose a valid role.",
  }),
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
