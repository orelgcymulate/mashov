'use client';

import { useState } from 'react';
import { grades as gradesHooks } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { KidCard } from '@/components/KidCard';
import { Dialog } from '@/components/ui/Dialog';
import { GradeForm } from '@/components/forms/GradeForm';
import { shortDate } from '@/lib/dates';
import type { Grade } from '@mashov/shared';

export default function GradesPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const list = gradesHooks.useList();
  const create = gradesHooks.useCreate();
  const update = gradesHooks.useUpdate();
  const del = gradesHooks.useDelete();
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Grade | null>(null);

  if (loading || list.isLoading) return <div className="p-6">טוען…</div>;
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ציונים</h1>
        <button className="btn" onClick={() => setOpenCreate(true)} disabled={kids.length === 0}>
          + ציון חדש
        </button>
      </div>

      <div className={selectedKids.length > 1 ? 'grid sm:grid-cols-2 gap-4' : ''}>
        {selectedKids.map((k) => {
          const own = items.filter((g) => g.kidId === k._id);
          const nums = own.map((g) => g.grade);
          const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
          return (
            <KidCard
              key={k._id}
              kid={k}
              title={k.name}
              sub="ציונים אחרונים"
              count={avg !== null ? `ממוצע ${avg.toFixed(1)}` : undefined}
            >
              {own.length === 0 && <div className="text-sm" style={{ color: 'var(--muted)' }}>אין ציונים</div>}
              {own.map((g) => (
                <div key={g._id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{g.subject}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {g.event} · {shortDate(g.eventDate)}
                    </div>
                  </div>
                  <div className="text-lg font-bold tabular-nums">{g.grade}</div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button onClick={() => setEditTarget(g)} aria-label="עריכה">✎</button>
                    <button onClick={() => del.mutate(g._id)} aria-label="מחיקה">🗑</button>
                  </div>
                </div>
              ))}
            </KidCard>
          );
        })}
      </div>

      <Dialog open={openCreate} title="ציון חדש" onClose={() => setOpenCreate(false)}>
        <GradeForm onSubmit={async (v) => { await create.mutateAsync(v); setOpenCreate(false); }} />
      </Dialog>
      <Dialog open={!!editTarget} title="עריכת ציון" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <GradeForm
            defaultValues={editTarget}
            submitLabel="עדכון"
            onSubmit={async (v) => { await update.mutateAsync({ id: editTarget._id, patch: v }); setEditTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}
