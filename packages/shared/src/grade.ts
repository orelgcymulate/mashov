import { z } from 'zod';
import { baseEntity, dateLike, objectId } from './common';

export const GradeCreateSchema = z.object({
  kidId: objectId,
  subject: z.string().min(1).max(80),
  event: z.string().min(1).max(200),
  grade: z.number().min(0).max(100),
  gradeType: z.string().max(60).default('מבחן'),
  eventDate: dateLike,
  teacherName: z.string().max(120).optional(),
});

export const GradeUpdateSchema = GradeCreateSchema.partial();

export const GradeSchema = GradeCreateSchema.extend(baseEntity.shape);

export type GradeCreate = z.infer<typeof GradeCreateSchema>;
export type GradeUpdate = z.infer<typeof GradeUpdateSchema>;
export type Grade = z.infer<typeof GradeSchema>;
