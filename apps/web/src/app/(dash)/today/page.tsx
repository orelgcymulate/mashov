'use client';

import { useDashboardSummary } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { LESSON_TIMES } from '@mashov/shared';
import { daysUntil, todayScheduleDay } from '@/lib/dates';
import { CallButton } from '@/components/call/CallButton';

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

  const scheduleDay = todayScheduleDay();

  // Urgent homework: overdue or due today/tomorrow, not done.
  const urgent: Array<{ kidId: string; subject: string; text: string; days: number; teacher?: string }> = [];
  for (const k of selectedKids) {
    const hw = data.kids[k._id]?.homework ?? [];
    for (const h of hw) {
      if (h.done) continue;
      const days = daysUntil(h.lessonDate);
      if (days !== null && days <= 1) {
        urgent.push({ kidId: k._id, subject: h.subject, text: h.homework, days, teacher: h.teacherName });
      }
    }
  }

  // Combined event list = schedule slots for today, across selected kids.
  type Slot = { kidId: string; lesson: number; subject: string; roomNum?: string; key: string };
  const events: Slot[] = [];
  for (const k of selectedKids) {
    const slots = (data.kids[k._id]?.schedule ?? []).filter((s) => s.day === scheduleDay);
    const seen = new Set<number>();
    for (const s of slots) {
      if (seen.has(s.lesson)) continue;
      seen.add(s.lesson);
      events.push({ kidId: k._id, lesson: s.lesson, subject: s.subject, roomNum: s.roomNum, key: s._id });
    }
  }
  events.sort((a, b) => a.lesson - b.lesson);

  // Pending homework count per kid for the bottom tiles.
  const pendingCount = (kidId: string) =>
    (data.kids[kidId]?.homework ?? []).filter((h) => !h.done).length;

  return (
    <div className="space-y-4">
      {/* Prominent call strip — primary action on the phone view. */}
      <section className="call-strip">
        {selectedKids.map((k) => (
          <div key={k._id} className="call-strip__card" style={{ borderColor: tintFor(k.color, 0.5) }}>
            <span className="call-strip__avatar" style={{ background: k.color }} aria-hidden>
              {k.name[0]}
            </span>
            <span className="call-strip__name" style={{ color: k.color }}>{k.name}</span>
            <CallButton kidId={k._id} kidName={k.name} kidColor={k.color} />
          </div>
        ))}
      </section>

      {urgent.length > 0 && (
        <section className="alert-forget">
          <div className="flex items-center justify-end mb-2">
            <span className="alert-forget__title">⚠ אל תשכחו</span>
          </div>
          <ul className="space-y-2">
            {urgent.slice(0, 6).map((u, i) => {
              const kid = kids.find((k) => k._id === u.kidId);
              return (
                <li key={i} className="flex gap-2">
                  <span className="urgency-dot" aria-hidden>!</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-snug">{u.text}</div>
                    <div className="text-xs leading-snug" style={{ color: 'var(--muted)' }}>
                      <span style={{ color: kid?.color ?? 'inherit', fontWeight: 600 }}>{kid?.name}</span>
                      {u.teacher ? ` · ${u.teacher}` : ''} · {u.subject} ·{' '}
                      {u.days <= 0 ? 'היום' : `בעוד ${u.days} י׳`}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{events.length} אירועים</span>
          <h2 className="text-xl font-bold">היום</h2>
        </div>
        {events.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--muted)' }}>אין שיעורים היום</div>
        ) : (
          <ul className="space-y-2.5">
            {events.map((s) => {
              const kid = kids.find((k) => k._id === s.kidId)!;
              const t = LESSON_TIMES[s.lesson];
              const timeLabel = t ? `${t.start}–${t.end}` : `שיעור ${s.lesson}`;
              return (
                <li key={s.key} className="flex items-center gap-3 text-sm">
                  <span className="tabular-nums" style={{ color: 'var(--muted)', minWidth: 96, textAlign: 'start' }}>
                    {timeLabel}
                  </span>
                  <span className="pill-dot" style={{ background: kid.color }} aria-hidden />
                  <span className="flex-1">
                    <span className="font-medium">{kid.name}</span>
                    {' · '}
                    {s.subject}
                    {s.roomNum ? ` · ${s.roomNum}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={selectedKids.length > 1 ? 'grid grid-cols-2 gap-3' : ''}>
        {selectedKids.map((k) => (
          <div
            key={k._id}
            className="kid-tile"
            style={{
              background: tintFor(k.color),
              borderColor: tintFor(k.color, 0.25),
            }}
          >
            <div className="kid-tile__head" style={{ color: k.color }}>
              <span>{k.name}</span>
              <span className="kid-tile__badge" style={{ background: k.color }}>
                {k.name[0]}
              </span>
            </div>
            <div className="kid-tile__row">
              <span className="kid-tile__count" style={{ color: k.color }}>
                {pendingCount(k._id)}
              </span>
              <span>שיעורי בית</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function tintFor(hex: string, alpha = 0.12): string {
  if (!hex?.startsWith('#') || hex.length < 7) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
