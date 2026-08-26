import * as z from "zod";

import { paginationSchema, uuidSchema } from "@/schemas/common";

export const listNotificationsSchema = paginationSchema.extend({
  unreadOnly: z.boolean().default(false),
});

export const markNotificationReadSchema = z.object({
  notificationId: uuidSchema,
});

export const deleteNotificationSchema = z.object({
  notificationId: uuidSchema,
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type MarkNotificationReadInput = z.infer<
  typeof markNotificationReadSchema
>;
export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;
