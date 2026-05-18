'use client';

import { useState } from 'react';
import { homework as homeworkHooks, useToggleHomeworkDone } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { Dialog } from '@/components/ui/Dialog';
import { HomeworkForm } from '@/components/forms/HomeworkForm';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { daysUntil, shortDate } from '@/lib/dates';
import type { Homework, Kid } from '@mashov/shared';

export default function TasksPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const list = homeworkHooks.useList();
  const create = homeworkHooks.useCreate();
  const update = homeworkHooks.useUpdate();
  const del = homeworkHooks.useDelete();
  const toggleDone = useToggleHomeworkDone();
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Homework | null>(null);

  if (loading || list.isLoading) return <div className="p-6">טוען…</div>;
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">משימות</h1>
        <button className="btn" onClick={() => setOpenCreate(true)} disabled={kids.length === 0}>
          + משימה חדשה
        </button>
      </div>

      <div className={selectedKids.length > 1 ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {selectedKids.map((k) => {
          const own = items
            .filter((h) => h.kidId === k._id)
            .sort((a, b) => +new Date(a.lessonDate) - +new Date(b.lessonDate));
          const pending = own.filter((h) => !h.done);
          const done = own.filter((h) => h.done);
          return (
            <KidColumn
              key={k._id}
              kid={k}
              doneCount={done.length}
              total={own.length}
            >
              {own.length === 0 && (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>אין משימות</div>
              )}
              {pending.map((h) => (
                <HomeworkCard
                  key={h._id}
                  item={h}
                  kid={k}
                  onToggle={() => toggleDone.mutate({ id: h._id, done: !h.done })}
                  onEdit={() => setEditTarget(h)}
                  onDelete={() => del.mutate(h._id)}
                />
              ))}
              {done.length > 0 && (
                <details className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <summary className="text-xs cursor-pointer" style={{ color: 'var(--muted)' }}>
                    הושלמו ({done.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {done.map((h) => (
                      <HomeworkCard
                        key={h._id}
                        item={h}
                        kid={k}
                        onToggle={() => toggleDone.mutate({ id: h._id, done: !h.done })}
                        onEdit={() => setEditTarget(h)}
                        onDelete={() => del.mutate(h._id)}
                        dim
                      />
                    ))}
                  </div>
                </details>
              )}
            </KidColumn>
          );
        })}
      </div>

      <Dialog open={openCreate} title="משימה חדשה" onClose={() => setOpenCreate(false)}>
        <HomeworkForm
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            setOpenCreate(false);
          }}
        />
      </Dialog>
      <Dialog open={!!editTarget} title="עריכת משימה" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <HomeworkForm
            defaultValues={editTarget}
            submitLabel="עדכון"
            onSubmit={async (values) => {
              await update.mutateAsync({ id: editTarget._id, patch: values });
              setEditTarget(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function KidColumn({
  kid,
  doneCount,
  total,
  children,
}: {
  kid: Kid;
  doneCount: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-3 space-y-2">
      <header className="flex items-center justify-between pb-2">
        <span className="score-chip" aria-label="התקדמות">
          {doneCount}/{total}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: kid.color }}>{kid.name}</span>
          <span
            className="w-7 h-7 rounded-full grid place-items-center text-white text-sm font-bold"
            style={{ background: kid.color }}
            aria-hidden
          >
            {kid.name[0]}
          </span>
        </div>
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function HomeworkCard({
  item,
  kid,
  onToggle,
  onEdit,
  onDelete,
  dim,
}: {
  item: Homework;
  kid: Kid;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  dim?: boolean;
}) {
  const days = daysUntil(item.lessonDate);
  const isUrgent = days !== null && days <= 1 && !item.done;
  return (
    <article
      className={`rounded-2xl p-3 ${dim ? 'opacity-60' : ''}`}
      style={{
        background: '#f7f8fb',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex gap-1.5 flex-wrap">
          {isUrgent && (
            <span className="task-pill task-pill--danger">
              {days! <= 0 ? 'דחוף' : 'מחר'}
            </span>
          )}
          <span className="task-pill task-pill--subject">{item.subject}</span>
        </div>
        <button
          onClick={onToggle}
          className="check-circle"
          aria-pressed={item.done}
          aria-label={item.done ? 'בטל סימון' : 'סמן כהושלם'}
          style={
            item.done
              ? { background: kid.color, borderColor: kid.color, color: 'white' }
              : undefined
          }
        >
          ✓
        </button>
      </div>
      <div className={`text-sm leading-snug ${item.done ? 'line-through' : ''}`}>{item.homework}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          {days !== null
            ? `${days <= 0 ? 'היום' : days === 1 ? 'מחר' : `בעוד ${days} י׳`} · ${shortDate(item.lessonDate)}`
            : shortDate(item.lessonDate)}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} aria-label="עריכה" className="p-1" style={{ color: 'var(--muted)' }}>
            <PencilIcon width={16} height={16} />
          </button>
          <button onClick={onDelete} aria-label="מחיקה" className="p-1" style={{ color: 'var(--muted)' }}>
            <TrashIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
