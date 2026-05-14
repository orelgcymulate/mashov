import { z } from 'zod';
import { baseEntity, objectId } from './common';

export const ScheduleSlotCreateSchema = z.object({
  kidId: objectId,
  day: z.number().int().min(1).max(7),
  lesson: z.number().int().min(1).max(8),
  subject: z.string().min(1).max(80),
  roomNum: z.string().max(40).optional(),
  teacher: z.string().max(120).optional(),
});

export const ScheduleSlotUpdateSchema = ScheduleSlotCreateSchema.partial();

export const ScheduleSlotSchema = ScheduleSlotCreateSchema.extend(baseEntity.shape);

export type ScheduleSlotCreate = z.infer<typeof ScheduleSlotCreateSchema>;
export type ScheduleSlotUpdate = z.infer<typeof ScheduleSlotUpdateSchema>;
export type ScheduleSlot = z.infer<typeof ScheduleSlotSchema>;
