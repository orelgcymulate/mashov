'use client';

import { useState } from 'react';
import { notifications as notificationsHooks } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { KidCard } from '@/components/KidCard';
import { Dialog } from '@/components/ui/Dialog';
import { NotificationForm } from '@/components/forms/NotificationForm';
import { shortDate } from '@/lib/dates';
import type { Notification } from '@mashov/shared';

export default function NotificationsPage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const list = notificationsHooks.useList();
  const create = notificationsHooks.useCreate();
  const update = notificationsHooks.useUpdate();
  const del = notificationsHooks.useDelete();
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Notification | null>(null);

  if (loading || list.isLoading) return <div className="p-6">טוען…</div>;
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">התראות</h1>
        <button className="btn" onClick={() => setOpenCreate(true)} disabled={kids.length === 0}>+ התראה חדשה</button>
      </div>
      <div className={selectedKids.length > 1 ? 'grid sm:grid-cols-2 gap-4' : ''}>
        {selectedKids.map((k) => {
          const own = items.filter((n) => n.kidId === k._id);
          return (
            <KidCard key={k._id} kid={k} title={k.name} sub="התראות">
              {own.length === 0 && <div className="text-sm" style={{ color: 'var(--muted)' }}>אין התראות</div>}
              {own.map((n) => (
                <div key={n._id} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <span className={`mt-1 w-2 h-2 rounded-full ${n.isNew ? '' : 'opacity-30'}`} style={{ background: k.color }} aria-hidden />
                  <div className="flex-1">
                    <div className={`text-sm ${n.isNew ? 'font-medium' : ''}`}>{n.text}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{shortDate(n.date)}</div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button onClick={() => setEditTarget(n)} aria-label="עריכה">✎</button>
                    <button onClick={() => del.mutate(n._id)} aria-label="מחיקה">🗑</button>
                  </div>
                </div>
              ))}
            </KidCard>
          );
        })}
      </div>
      <Dialog open={openCreate} title="התראה חדשה" onClose={() => setOpenCreate(false)}>
        <NotificationForm onSubmit={async (v) => { await create.mutateAsync(v); setOpenCreate(false); }} />
      </Dialog>
      <Dialog open={!!editTarget} title="עריכת התראה" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <NotificationForm
            defaultValues={editTarget}
            submitLabel="עדכון"
            onSubmit={async (v) => { await update.mutateAsync({ id: editTarget._id, patch: v }); setEditTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}
