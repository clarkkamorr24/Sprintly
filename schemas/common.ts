import * as z from "zod";

import { PAGE_SIZE } from "@/lib/constants";

export const uuidSchema = z.uuid({ error: "A valid id is required." });

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, { error: "Must be a hex color such as #6366f1." });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE.MAX)
    .default(PAGE_SIZE.DEFAULT),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
