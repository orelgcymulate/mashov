'use client';

import { useState } from 'react';
import { schedule as scheduleHooks } from '@/lib/hooks/useEntities';
import { useKidCtx } from '@/lib/kid-context';
import { KidCard } from '@/components/KidCard';
import { Dialog } from '@/components/ui/Dialog';
import { ScheduleForm } from '@/components/forms/ScheduleForm';
import { HE_DAYS, LESSON_TIMES, ScheduleSlot } from '@mashov/shared';

const DAYS = [1, 2, 3, 4, 5, 6] as const;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function SchedulePage() {
  const { kids, selectedKids, loading } = useKidCtx();
  const list = scheduleHooks.useList();
  const create = scheduleHooks.useCreate();
  const update = scheduleHooks.useUpdate();
  const del = scheduleHooks.useDelete();
  const [open, setOpen] = useState<{ kidId: string; day?: number; lesson?: number; slot?: ScheduleSlot } | null>(null);

  if (loading || list.isLoading) return <div className="p-6">טוען…</div>;
  const items = list.data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">מערכת שבועית</h1>
      <div className="space-y-6">
        {selectedKids.map((k) => {
          const own = items.filter((s) => s.kidId === k._id);
          const byKey = new Map<string, ScheduleSlot>();
          for (const s of own) byKey.set(`${s.day}-${s.lesson}`, s);
          return (
            <KidCard key={k._id} kid={k} title={k.name} sub="מערכת שבועית">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-start p-1" style={{ color: 'var(--muted)' }}>שיעור</th>
                      {DAYS.map((d) => (
                        <th key={d} className="p-1" style={{ color: 'var(--muted)' }}>
                          {HE_DAYS[d - 1]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LESSONS.map((lesson) => (
                      <tr key={lesson}>
                        <td className="p-1 align-top">
                          <div className="font-medium">{lesson}</div>
                          <div className="tabular-nums" style={{ color: 'var(--muted)' }}>
                            {LESSON_TIMES[lesson]?.start ?? ''}
                          </div>
                        </td>
                        {DAYS.map((day) => {
                          const slot = byKey.get(`${day}-${lesson}`);
                          return (
                            <td key={day} className="p-1 align-top">
                              <button
                                onClick={() => setOpen({ kidId: k._id, day, lesson, slot })}
                                className="w-full text-start rounded-md p-1.5 min-h-[44px]"
                                style={{
                                  background: slot ? 'var(--kid-color-soft)' : 'transparent',
                                  border: '1px dashed',
                                  borderColor: slot ? k.color : 'var(--border)',
                                }}
                              >
                                {slot ? (
                                  <>
                                    <div className="font-medium leading-tight">{slot.subject}</div>
                                    {slot.roomNum && <div style={{ color: 'var(--muted)' }}>{slot.roomNum}</div>}
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>+</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </KidCard>
          );
        })}
        {kids.length === 0 && (
          <div className="card p-6 text-center">
            עדיין אין ילדים. <a href="/kids" className="underline">הוסף ילד</a>.
          </div>
        )}
      </div>

      <Dialog
        open={!!open}
        title={open?.slot ? 'עריכת שיעור' : 'הוספת שיעור'}
        onClose={() => setOpen(null)}
      >
        {open && (
          <div className="space-y-3">
            <ScheduleForm
              defaultValues={
                open.slot ?? {
                  kidId: open.kidId,
                  day: open.day,
                  lesson: open.lesson,
                  subject: '',
                }
              }
              submitLabel={open.slot ? 'עדכון' : 'הוספה'}
              onSubmit={async (values) => {
                if (open.slot) {
                  await update.mutateAsync({ id: open.slot._id, patch: values });
                } else {
                  await create.mutateAsync(values);
                }
                setOpen(null);
              }}
            />
            {open.slot && (
              <button
                className="btn-ghost btn w-full justify-center text-red-600"
                onClick={async () => {
                  if (open.slot) {
                    await del.mutateAsync(open.slot._id);
                    setOpen(null);
                  }
                }}
              >
                מחיקה
              </button>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
