'use client';

import { useState } from 'react';
import { behavior as behaviorHooks } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { KidCard } from '@/components/KidCard';
import { Dialog } from '@/components/ui/Dialog';
import { BehaviorForm } from '@/components/forms/BehaviorForm';
import { shortDate } from '@/lib/dates';
import type { Behavior } from '@mashov/shared';

export default function BehaviorPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const list = behaviorHooks.useList();
  const create = behaviorHooks.useCreate();
  const update = behaviorHooks.useUpdate();
  const del = behaviorHooks.useDelete();
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Behavior | null>(null);

  if (loading || list.isLoading) return <div className="p-6">טוען…</div>;
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">התנהגות</h1>
        <button className="btn" onClick={() => setOpenCreate(true)} disabled={kids.length === 0}>+ אירוע חדש</button>
      </div>
      <div className={selectedKids.length > 1 ? 'grid sm:grid-cols-2 gap-4' : ''}>
        {selectedKids.map((k) => {
          const own = items.filter((b) => b.kidId === k._id);
          return (
            <KidCard key={k._id} kid={k} title={k.name} sub="אירועי התנהגות" count={`${own.length} אירועים`}>
              {own.length === 0 && <div className="text-sm" style={{ color: 'var(--muted)' }}>אין אירועים</div>}
              {own.map((b) => (
                <div key={b._id} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{b.eventType}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {b.subject} · {shortDate(b.date)}
                    </div>
                    {b.note && <div className="text-sm mt-1">{b.note}</div>}
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button onClick={() => setEditTarget(b)} aria-label="עריכה">✎</button>
                    <button onClick={() => del.mutate(b._id)} aria-label="מחיקה">🗑</button>
                  </div>
                </div>
              ))}
            </KidCard>
          );
        })}
      </div>
      <Dialog open={openCreate} title="אירוע התנהגות חדש" onClose={() => setOpenCreate(false)}>
        <BehaviorForm onSubmit={async (v) => { await create.mutateAsync(v); setOpenCreate(false); }} />
      </Dialog>
      <Dialog open={!!editTarget} title="עריכת אירוע" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <BehaviorForm
            defaultValues={editTarget}
            submitLabel="עדכון"
            onSubmit={async (v) => { await update.mutateAsync({ id: editTarget._id, patch: v }); setEditTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}
