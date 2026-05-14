'use client';

import { useState } from 'react';
import { kids as kidsHooks } from '@/lib/hooks/useEntities';
import { Dialog } from '@/components/ui/Dialog';
import { KidForm } from '@/components/forms/KidForm';
import type { Kid } from '@mashov/shared';

export default function KidsPage() {
  const list = kidsHooks.useList();
  const create = kidsHooks.useCreate();
  const update = kidsHooks.useUpdate();
  const del = kidsHooks.useDelete();
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Kid | null>(null);

  if (list.isLoading) return <div className="p-6">טוען…</div>;
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ניהול ילדים</h1>
        <button className="btn" onClick={() => setOpenCreate(true)}>+ הוסף ילד</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {items.length === 0 && (
          <div className="card p-6 text-center sm:col-span-2">
            עדיין אין ילדים. לחץ "הוסף ילד".
          </div>
        )}
        {items.map((k) => (
          <div key={k._id} className="card p-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full grid place-items-center text-white text-lg font-bold"
              style={{ background: k.color }}
            >
              {k.name[0]}
            </div>
            <div className="flex-1">
              <div className="font-medium">{k.name}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{k.slug} · {k.color}</div>
            </div>
            <button onClick={() => setEditTarget(k)} className="text-sm">✎</button>
            <button onClick={() => {
              if (confirm(`למחוק את ${k.name}? פעולה זו תמחק את כל המידע המשויך לאחר deletion.`)) {
                del.mutate(k._id);
              }
            }} className="text-sm">🗑</button>
          </div>
        ))}
      </div>

      <Dialog open={openCreate} title="הוספת ילד" onClose={() => setOpenCreate(false)}>
        <KidForm onSubmit={async (v) => { await create.mutateAsync(v); setOpenCreate(false); }} />
      </Dialog>
      <Dialog open={!!editTarget} title="עריכת ילד" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <KidForm
            defaultValues={editTarget}
            submitLabel="עדכון"
            onSubmit={async (v) => { await update.mutateAsync({ id: editTarget._id, patch: v }); setEditTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}
