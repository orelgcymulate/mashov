import { z } from 'zod';
import { baseEntity, dateLike, objectId } from './common';

export const NotificationCreateSchema = z.object({
  kidId: objectId,
  text: z.string().min(1).max(500),
  date: dateLike,
  isNew: z.boolean().default(true),
});

export const NotificationUpdateSchema = NotificationCreateSchema.partial();

export const NotificationSchema = NotificationCreateSchema.extend(baseEntity.shape);

export type NotificationCreate = z.infer<typeof NotificationCreateSchema>;
export type NotificationUpdate = z.infer<typeof NotificationUpdateSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
