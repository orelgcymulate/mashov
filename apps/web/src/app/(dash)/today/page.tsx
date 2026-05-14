'use client';

import { useDashboardSummary } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { KidCard } from '@/components/KidCard';
import { LESSON_TIMES } from '@mashov/shared';
import { daysUntil, todayScheduleDay } from '@/lib/dates';

export default function TodayPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const ids = kids.map((k) => k._id);
  const { data, isLoading } = useDashboardSummary(ids);

  if (loading || isLoading) return <div className="p-6">טוען…</div>;
  if (kids.length === 0) {
    return (
      <div className="card p-6 text-center">
        עדיין אין ילדים. <a href="/kids" className="underline">הוסף ילד</a> כדי להתחיל.
      </div>
    );
  }
  if (!data) return <div className="p-6">אין נתונים זמינים.</div>;

  const day = todayScheduleDay();

  // Urgent homework — overdue or due today/tomorrow, not done.
  const urgent: Array<{ kidId: string; subject: string; text: string; days: number }> = [];
  for (const k of selectedKids) {
    const hw = data.kids[k._id]?.homework ?? [];
    for (const h of hw) {
      if (h.done) continue;
      const days = daysUntil(h.lessonDate);
      if (days !== null && days <= 1) {
        urgent.push({ kidId: k._id, subject: h.subject, text: h.homework, days });
      }
    }
  }

  return (
    <div className="space-y-4">
      {urgent.length > 0 && (
        <section className="card p-4 border-amber-300" style={{ background: '#fffbe6' }}>
          <div className="font-semibold mb-2">⚠ אל תשכחו</div>
          <ul className="space-y-1.5 text-sm">
            {urgent.slice(0, 6).map((u, i) => {
              const kid = kids.find((k) => k._id === u.kidId);
              return (
                <li key={i} className="flex items-baseline gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full mt-1"
                    style={{ background: kid?.color ?? '#888' }}
                    aria-hidden
                  />
                  <span className="flex-1">
                    <span className="font-medium">{u.text}</span>
                    <span style={{ color: 'var(--muted)' }}> · {kid?.name} · {u.subject}</span>
                  </span>
                  <span className="text-xs">{u.days <= 0 ? 'היום' : `בעוד ${u.days} י׳`}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={selectedKids.length > 1 ? 'grid sm:grid-cols-2 gap-4' : ''}>
        {selectedKids.map((k) => {
          const slots = (data.kids[k._id]?.schedule ?? [])
            .filter((s) => s.day === day)
            .sort((a, b) => a.lesson - b.lesson);
          const seen = new Set<number>();
          const uniqueSlots = slots.filter((s) => {
            if (seen.has(s.lesson)) return false;
            seen.add(s.lesson);
            return true;
          });
          return (
            <KidCard
              key={k._id}
              kid={k}
              title="היום"
              sub={`${uniqueSlots.length} שיעורים`}
            >
              {uniqueSlots.length === 0 ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  אין שיעורים היום
                </div>
              ) : (
                uniqueSlots.map((s) => (
                  <div key={s._id} className="flex items-center gap-3 text-sm">
                    <span className="tabular-nums w-12" style={{ color: 'var(--muted)' }}>
                      {LESSON_TIMES[s.lesson]?.start ?? `שיעור ${s.lesson}`}
                    </span>
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: k.color }}
                      aria-hidden
                    />
                    <span className="flex-1">
                      {s.subject}
                      {s.roomNum ? ` · ${s.roomNum}` : ''}
                    </span>
                  </div>
                ))
              )}
            </KidCard>
          );
        })}
      </div>
    </div>
  );
}
