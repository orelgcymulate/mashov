import { jsDayToScheduleDay } from '@mashov/shared';

export function daysUntil(dateInput: string | Date | undefined): number | null {
  if (!dateInput) return null;
  const target = new Date(dateInput);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((+target - +today) / 86400000);
}

export function todayScheduleDay(): number {
  return jsDayToScheduleDay(new Date().getDay());
}

export function tomorrowScheduleDay(): number {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return jsDayToScheduleDay(t.getDay());
}

export function shortDate(d: string | Date | undefined): string {
  if (!d) return '';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '';
  return `${t.getDate()}/${t.getMonth() + 1}`;
}

export function tint(hex: string): string {
  if (!hex?.startsWith('#') || hex.length < 7) return '#fafafa';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}
