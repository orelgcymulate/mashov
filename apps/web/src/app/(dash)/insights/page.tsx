'use client';

import { useDashboardSummary } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { daysUntil } from '@/lib/dates';

export default function InsightsPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const ids = kids.map((k) => k._id);
  const { data, isLoading } = useDashboardSummary(ids);

  if (loading || isLoading) return <div className="p-6">טוען…</div>;
  if (!data) return <div className="p-6">אין נתונים זמינים.</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">תובנות</h1>

      <div className={selectedKids.length > 1 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {selectedKids.map((k) => {
          const hw = data.kids[k._id]?.homework ?? [];
          const messages = data.kids[k._id]?.messages ?? [];
          const grades = data.kids[k._id]?.grades ?? [];
          const total = hw.length;
          const done = hw.filter((h) => h.done).length;
          const overdue = hw.filter(
            (h) => !h.done && (daysUntil(h.lessonDate) ?? 99) < 0,
          ).length;
          const dueSoon = hw.filter(
            (h) => !h.done && (daysUntil(h.lessonDate) ?? 99) <= 1 && (daysUntil(h.lessonDate) ?? -1) >= 0,
          ).length;
          const avgGrade =
            grades.length > 0
              ? Math.round(grades.reduce((s, g) => s + (g.grade ?? 0), 0) / grades.length)
              : null;

          return (
            <section key={k._id} className="card p-4 space-y-3">
              <header className="flex items-center justify-end gap-2">
                <span className="text-base font-bold" style={{ color: k.color }}>{k.name}</span>
                <span
                  className="w-7 h-7 rounded-full grid place-items-center text-white text-sm font-bold"
                  style={{ background: k.color }}
                  aria-hidden
                >
                  {k.name[0]}
                </span>
              </header>

              <Stat label="הושלמו / סה״כ משימות" value={`${done}/${total}`} color={k.color} />
              <Stat label="באיחור" value={overdue} color={overdue > 0 ? 'var(--danger)' : undefined} />
              <Stat label="להיום/מחר" value={dueSoon} />
              <Stat label="הודעות פתוחות" value={messages.length} />
              <Stat label="ממוצע ציונים" value={avgGrade !== null ? `${avgGrade}` : '–'} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
