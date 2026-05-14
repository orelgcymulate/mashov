'use client';

import { useState } from 'react';
import { messages as messagesHooks } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { KidCard } from '@/components/KidCard';
import { Dialog } from '@/components/ui/Dialog';
import { MessageForm } from '@/components/forms/MessageForm';
import { shortDate } from '@/lib/dates';
import type { Message } from '@mashov/shared';

export default function MessagesPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const list = messagesHooks.useList();
  const create = messagesHooks.useCreate();
  const update = messagesHooks.useUpdate();
  const del = messagesHooks.useDelete();
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Message | null>(null);

  if (loading || list.isLoading) return <div className="p-6">טוען…</div>;
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">הודעות</h1>
        <button className="btn" onClick={() => setOpenCreate(true)} disabled={kids.length === 0}>+ הודעה חדשה</button>
      </div>
      <div className={selectedKids.length > 1 ? 'grid sm:grid-cols-2 gap-4' : ''}>
        {selectedKids.map((k) => {
          const own = items.filter((m) => m.kidId === k._id);
          const newCount = own.filter((m) => m.isNew).length;
          return (
            <KidCard key={k._id} kid={k} title={k.name} sub={`${own.length} הודעות`} count={newCount > 0 ? `${newCount} חדש` : undefined}>
              {own.length === 0 && <div className="text-sm" style={{ color: 'var(--muted)' }}>אין הודעות</div>}
              {own.map((m) => (
                <div key={m._id} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{shortDate(m.sentAt)}</span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>· {m.sender}</span>
                    </div>
                    <div className={`text-sm ${m.isNew ? 'font-semibold' : ''}`}>{m.subject}</div>
                    {m.body && <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{m.body}</div>}
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button onClick={() => setEditTarget(m)} aria-label="עריכה">✎</button>
                    <button onClick={() => del.mutate(m._id)} aria-label="מחיקה">🗑</button>
                  </div>
                </div>
              ))}
            </KidCard>
          );
        })}
      </div>
      <Dialog open={openCreate} title="הודעה חדשה" onClose={() => setOpenCreate(false)}>
        <MessageForm onSubmit={async (v) => { await create.mutateAsync(v); setOpenCreate(false); }} />
      </Dialog>
      <Dialog open={!!editTarget} title="עריכת הודעה" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <MessageForm
            defaultValues={editTarget}
            submitLabel="עדכון"
            onSubmit={async (v) => { await update.mutateAsync({ id: editTarget._id, patch: v }); setEditTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}
