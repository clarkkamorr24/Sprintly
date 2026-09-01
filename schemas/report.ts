import * as z from "zod";

export const REPORT_RANGES = [7, 14, 30, 90] as const;

export const reportRangeSchema = z.coerce
  .number()
  .int()
  .refine((value): value is (typeof REPORT_RANGES)[number] =>
    (REPORT_RANGES as readonly number[]).includes(value)
  )
  .catch(30);

export type ReportRange = (typeof REPORT_RANGES)[number];
