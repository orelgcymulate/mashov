'use client';

import { useDashboardSummary } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { shortDate } from '@/lib/dates';

type Entry = {
  key: string;
  kidId: string;
  when: string;
  title: string;
  body?: string;
  kind: 'message' | 'behavior' | 'done';
};

export default function JournalPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const ids = kids.map((k) => k._id);
  const { data, isLoading } = useDashboardSummary(ids);

  if (loading || isLoading) return <div className="p-6">טוען…</div>;
  if (!data) return <div className="p-6">אין נתונים זמינים.</div>;

  const entries: Entry[] = [];
  for (const k of selectedKids) {
    const s = data.kids[k._id];
    if (!s) continue;
    for (const m of s.messages) {
      entries.push({
        key: `m-${m._id}`,
        kidId: k._id,
        when: m.sentAt ?? m.createdAt ?? '',
        title: m.subject ?? 'הודעה',
        body: m.body,
        kind: 'message',
      });
    }
    for (const b of s.behavior) {
      entries.push({
        key: `b-${b._id}`,
        kidId: k._id,
        when: b.date ?? b.createdAt ?? '',
        title: b.subject ?? 'התנהגות',
        body: b.note,
        kind: 'behavior',
      });
    }
    for (const h of s.homework) {
      if (h.done && h.completedAt) {
        entries.push({
          key: `h-${h._id}`,
          kidId: k._id,
          when: h.completedAt,
          title: `הושלמה: ${h.subject}`,
          body: h.homework,
          kind: 'done',
        });
      }
    }
  }
  entries.sort((a, b) => +new Date(b.when) - +new Date(a.when));

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">יומן</h1>
      {entries.length === 0 ? (
        <div className="card p-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
          אין רשומות עדיין.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.slice(0, 50).map((e) => {
            const k = kids.find((kk) => kk._id === e.kidId);
            return (
              <li
                key={e.key}
                className="card p-3"
                style={{ borderInlineEnd: `4px solid ${k?.color ?? 'transparent'}` }}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{shortDate(e.when)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: k?.color }}>{k?.name}</span>
                    <KindBadge kind={e.kind} />
                  </div>
                </div>
                <div className="font-semibold text-sm">{e.title}</div>
                {e.body && (
                  <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{e.body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function KindBadge({ kind }: { kind: Entry['kind'] }) {
  const map = {
    message: { label: 'הודעה', cls: 'task-pill--subject' },
    behavior: { label: 'התנהגות', cls: 'task-pill--danger' },
    done: { label: 'הושלם', cls: 'task-pill--subject' },
  } as const;
  const v = map[kind];
  return <span className={`task-pill ${v.cls}`}>{v.label}</span>;
}
