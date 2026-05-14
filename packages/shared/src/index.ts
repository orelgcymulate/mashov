export * from './common';
export * from './kid';
export * from './homework';
export * from './schedule';
export * from './grade';
export * from './behavior';
export * from './message';
export * from './notification';
export * from './auth';
export * from './dashboard';

export const ENTITIES = [
  'kids',
  'homework',
  'schedule',
  'grades',
  'behavior',
  'messages',
  'notifications',
] as const;

export type EntityName = (typeof ENTITIES)[number];

export const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;
export const HE_MONTHS = [
  'בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני',
  'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר',
] as const;

export const LESSON_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:50', end: '09:35' },
  3: { start: '09:55', end: '10:40' },
  4: { start: '10:45', end: '11:30' },
  5: { start: '11:45', end: '12:30' },
  6: { start: '12:35', end: '13:20' },
  7: { start: '13:25', end: '14:10' },
  8: { start: '14:15', end: '15:00' },
};

// JS getDay (0=Sun..6=Sat) → Mashov-style (1=Sun..7=Sat) used by ScheduleSlot.day
export function jsDayToScheduleDay(jsDay: number): number {
  return jsDay + 1;
}
