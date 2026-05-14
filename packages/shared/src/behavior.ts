import { z } from 'zod';
import { baseEntity, dateLike, objectId } from './common';

export const BehaviorCreateSchema = z.object({
  kidId: objectId,
  subject: z.string().min(1).max(80),
  eventType: z.string().min(1).max(80),
  note: z.string().max(1000).default(''),
  date: dateLike,
  justified: z.boolean().default(true),
  teacherName: z.string().max(120).optional(),
});

export const BehaviorUpdateSchema = BehaviorCreateSchema.partial();

export const BehaviorSchema = BehaviorCreateSchema.extend(baseEntity.shape);

export type BehaviorCreate = z.infer<typeof BehaviorCreateSchema>;
export type BehaviorUpdate = z.infer<typeof BehaviorUpdateSchema>;
export type Behavior = z.infer<typeof BehaviorSchema>;
