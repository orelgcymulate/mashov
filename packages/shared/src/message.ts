import { z } from 'zod';
import { baseEntity, dateLike, objectId } from './common';

export const MessageCreateSchema = z.object({
  kidId: objectId,
  subject: z.string().min(1).max(200),
  sender: z.string().min(1).max(120),
  body: z.string().max(5000).optional(),
  sentAt: dateLike,
  isNew: z.boolean().default(true),
});

export const MessageUpdateSchema = MessageCreateSchema.partial();

export const MessageSchema = MessageCreateSchema.extend(baseEntity.shape);

export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type MessageUpdate = z.infer<typeof MessageUpdateSchema>;
export type Message = z.infer<typeof MessageSchema>;
