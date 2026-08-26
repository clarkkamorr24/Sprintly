import * as z from "zod";

import { ProjectStatus } from "@/lib/generated/prisma/enums";
import { hexColorSchema, uuidSchema } from "@/schemas/common";

export const projectNameSchema = z
  .string()
  .trim()
  .min(2, { error: "Name must be at least 2 characters." })
  .max(60, { error: "Name must be 60 characters or fewer." });

const projectDescriptionSchema = z
  .string()
  .trim()
  .max(500, { error: "Description must be 500 characters or fewer." })
  .optional()
  .or(z.literal(""));

export const projectStatusSchema = z.enum(ProjectStatus, {
  error: "Choose a valid status.",
});

export const createProjectSchema = z.object({
  workspaceId: uuidSchema,
  name: projectNameSchema,
  description: projectDescriptionSchema,
  color: hexColorSchema,
  status: projectStatusSchema.default(ProjectStatus.PLANNING),
});

export const updateProjectSchema = z.object({
  projectId: uuidSchema,
  name: projectNameSchema,
  description: projectDescriptionSchema,
  color: hexColorSchema,
  status: projectStatusSchema,
});

export const deleteProjectSchema = z.object({
  projectId: uuidSchema,
});

export const listProjectsSchema = z.object({
  workspaceId: uuidSchema,
  status: projectStatusSchema.optional(),
  search: z.string().trim().max(80).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
