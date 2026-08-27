import * as z from "zod";

import { SprintStatus } from "@/lib/generated/prisma/enums";
import { uuidSchema } from "@/schemas/common";

export const sprintNameSchema = z
  .string()
  .trim()
  .min(2, { error: "Name must be at least 2 characters." })
  .max(60, { error: "Name must be 60 characters or fewer." });

const goalSchema = z
  .string()
  .trim()
  .max(280, { error: "Goal must be 280 characters or fewer." })
  .optional()
  .or(z.literal(""));

const dateSchema = z.union([z.iso.datetime({ offset: true }), z.iso.date()]);

export const sprintStatusSchema = z.enum(SprintStatus, {
  error: "Choose a valid status.",
});

export const createSprintSchema = z
  .object({
    projectId: uuidSchema,
    name: sprintNameSchema,
    goal: goalSchema,
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    error: "The end date must be after the start date.",
    path: ["endDate"],
  });

export const updateSprintSchema = z
  .object({
    sprintId: uuidSchema,
    name: sprintNameSchema,
    goal: goalSchema,
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    error: "The end date must be after the start date.",
    path: ["endDate"],
  });

export const changeSprintStatusSchema = z.object({
  sprintId: uuidSchema,
  status: sprintStatusSchema,
});

export const deleteSprintSchema = z.object({
  sprintId: uuidSchema,
});

export const assignTaskToSprintSchema = z.object({
  taskId: uuidSchema,
  sprintId: uuidSchema.nullable(),
});

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type ChangeSprintStatusInput = z.infer<typeof changeSprintStatusSchema>;
export type DeleteSprintInput = z.infer<typeof deleteSprintSchema>;
export type AssignTaskToSprintInput = z.infer<typeof assignTaskToSprintSchema>;
