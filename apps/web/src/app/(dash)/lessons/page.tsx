'use client';

import { useDashboardSummary } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { LESSON_TIMES } from '@mashov/shared';
import { todayScheduleDay } from '@/lib/dates';

export default function LessonsPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const ids = kids.map((k) => k._id);
  const { data, isLoading } = useDashboardSummary(ids);
  const day = todayScheduleDay();

  if (loading || isLoading) return <div className="p-6">טוען…</div>;
  if (!data) return <div className="p-6">אין נתונים זמינים.</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">שיעורים היום</h1>

      <div className={selectedKids.length > 1 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {selectedKids.map((k) => {
          const slots = (data.kids[k._id]?.schedule ?? [])
            .filter((s) => s.day === day)
            .sort((a, b) => a.lesson - b.lesson);
          const seen = new Set<number>();
          const uniq = slots.filter((s) => (seen.has(s.lesson) ? false : (seen.add(s.lesson), true)));
          return (
            <section key={k._id} className="card p-3 space-y-2">
              <header className="flex items-center justify-between pb-2">
                <span className="score-chip">{uniq.length} שיעורים</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold" style={{ color: k.color }}>{k.name}</span>
                  <span
                    className="w-7 h-7 rounded-full grid place-items-center text-white text-sm font-bold"
                    style={{ background: k.color }}
                    aria-hidden
                  >
                    {k.name[0]}
                  </span>
                </div>
              </header>
              {uniq.length === 0 ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>אין שיעורים היום</div>
              ) : (
                <ul className="space-y-2">
                  {uniq.map((s) => {
                    const t = LESSON_TIMES[s.lesson];
                    return (
                      <li
                        key={s._id}
                        className="rounded-2xl p-3 text-sm"
                        style={{ background: '#f7f8fb', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="task-pill task-pill--subject">שיעור {s.lesson}</span>
                          <span className="tabular-nums" style={{ color: 'var(--muted)' }}>
                            {t ? `${t.start}–${t.end}` : ''}
                          </span>
                        </div>
                        <div className="font-medium mt-1">{s.subject}</div>
                        {(s.roomNum || s.teacher) && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            {s.teacher}{s.teacher && s.roomNum ? ' · ' : ''}{s.roomNum ? `חדר ${s.roomNum}` : ''}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
