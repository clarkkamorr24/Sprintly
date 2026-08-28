import * as z from "zod";

import { ValidationError } from "@/lib/errors";

export function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): z.infer<Schema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(
      "Please correct the highlighted fields.",
      z.flattenError(result.error).fieldErrors as Record<string, string[]>
    );
  }

  return result.data;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
