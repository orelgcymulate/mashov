import { z } from 'zod';
import { baseEntity, dateLike, objectId } from './common';

export const HomeworkCreateSchema = z.object({
  kidId: objectId,
  subject: z.string().min(1).max(80),
  homework: z.string().min(1).max(2000),
  lessonDate: dateLike,
  dueDate: dateLike.optional(),
  teacherName: z.string().max(120).optional(),
  done: z.boolean().optional(),
});

export const HomeworkUpdateSchema = HomeworkCreateSchema.partial();

export const HomeworkSchema = HomeworkCreateSchema.extend(baseEntity.shape).extend({
  done: z.boolean(),
  completedAt: dateLike.nullable().optional(),
});

export type HomeworkCreate = z.infer<typeof HomeworkCreateSchema>;
export type HomeworkUpdate = z.infer<typeof HomeworkUpdateSchema>;
export type Homework = z.infer<typeof HomeworkSchema>;
