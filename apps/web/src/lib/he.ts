export function partOfDay(date: Date): { label: string; key: 'morning' | 'afternoon' | 'evening' | 'night' } {
  const h = date.getHours();
  if (h < 6) return { label: 'לילה', key: 'night' };
  if (h < 12) return { label: 'בוקר טוב', key: 'morning' };
  if (h < 17) return { label: 'אחר הצהריים', key: 'afternoon' };
  if (h < 21) return { label: 'ערב טוב', key: 'evening' };
  return { label: 'לילה טוב', key: 'night' };
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
