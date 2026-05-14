'use client';

import { useState } from 'react';
import { homework as homeworkHooks, useToggleHomeworkDone } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { KidCard } from '@/components/KidCard';
import { Dialog } from '@/components/ui/Dialog';
import { HomeworkForm } from '@/components/forms/HomeworkForm';
import { daysUntil, shortDate } from '@/lib/dates';
import type { Homework } from '@mashov/shared';

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
        <h1 className="text-xl font-semibold">משימות</h1>
        <button className="btn" onClick={() => setOpenCreate(true)} disabled={kids.length === 0}>
          + משימה חדשה
        </button>
      </div>

      <div className={selectedKids.length > 1 ? 'grid sm:grid-cols-2 gap-4' : ''}>
        {selectedKids.map((k) => {
          const own = items
            .filter((h) => h.kidId === k._id)
            .sort((a, b) => +new Date(a.lessonDate) - +new Date(b.lessonDate));
          const pending = own.filter((h) => !h.done);
          const done = own.filter((h) => h.done);
          return (
            <KidCard key={k._id} kid={k} title={k.name} sub="משימות בית" count={`${pending.length} פתוחות`}>
              {own.length === 0 && (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>אין משימות</div>
              )}
              {pending.map((h) => (
                <HomeworkRow
                  key={h._id}
                  item={h}
                  onToggle={() => toggleDone.mutate({ id: h._id, done: !h.done })}
                  onEdit={() => setEditTarget(h)}
                  onDelete={() => del.mutate(h._id)}
                />
              ))}
              {done.length > 0 && (
                <details className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <summary className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>
                    הושלמו ({done.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {done.map((h) => (
                      <HomeworkRow
                        key={h._id}
                        item={h}
                        onToggle={() => toggleDone.mutate({ id: h._id, done: !h.done })}
                        onEdit={() => setEditTarget(h)}
                        onDelete={() => del.mutate(h._id)}
                        dim
                      />
                    ))}
                  </div>
                </details>
              )}
            </KidCard>
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

function HomeworkRow({
  item,
  onToggle,
  onEdit,
  onDelete,
  dim,
}: {
  item: Homework;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  dim?: boolean;
}) {
  const days = daysUntil(item.lessonDate);
  return (
    <div
      className={`flex items-start gap-3 p-2 rounded-lg ${dim ? 'opacity-60' : ''}`}
      style={{ background: 'rgba(0,0,0,0.02)' }}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center text-xs ${
          item.done ? 'bg-green-600 text-white border-green-600' : 'bg-white'
        }`}
        style={!item.done ? { borderColor: 'var(--border)' } : undefined}
        aria-label={item.done ? 'בטל סימון' : 'סמן כהושלם'}
      >
        {item.done ? '✓' : ''}
      </button>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{item.subject}</span>
          {days !== null && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {days <= 0 ? 'היום' : days === 1 ? 'מחר' : `בעוד ${days} י׳`} · {shortDate(item.lessonDate)}
            </span>
          )}
        </div>
        <div className={`text-sm ${item.done ? 'line-through' : ''}`}>{item.homework}</div>
      </div>
      <div className="flex flex-col gap-1 text-xs">
        <button onClick={onEdit} aria-label="עריכה">✎</button>
        <button onClick={onDelete} aria-label="מחיקה">🗑</button>
      </div>
    </div>
  );
}
