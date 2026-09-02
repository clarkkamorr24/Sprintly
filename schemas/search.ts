import { z } from "zod";

import { uuidSchema } from "@/schemas/common";

export const searchWorkspaceSchema = z.object({
  workspaceId: uuidSchema,
  query: z.string().trim().min(1).max(120),
});

export type SearchWorkspaceInput = z.infer<typeof searchWorkspaceSchema>;
