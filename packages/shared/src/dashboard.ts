import { z } from 'zod';
import { HomeworkSchema } from './homework';
import { ScheduleSlotSchema } from './schedule';
import { GradeSchema } from './grade';
import { BehaviorSchema } from './behavior';
import { MessageSchema } from './message';
import { NotificationSchema } from './notification';

export const KidSummarySchema = z.object({
  homework: z.array(HomeworkSchema),
  schedule: z.array(ScheduleSlotSchema),
  grades: z.array(GradeSchema),
  behavior: z.array(BehaviorSchema),
  messages: z.array(MessageSchema),
  notifications: z.array(NotificationSchema),
});

export const DashboardSummarySchema = z.object({
  fetchedAt: z.string(),
  kids: z.record(z.string(), KidSummarySchema),
});

export type KidSummary = z.infer<typeof KidSummarySchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
