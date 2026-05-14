'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScheduleSlot, ScheduleSlotCreate, ScheduleSlotCreateSchema } from '@mashov/shared';
import { KidSelect } from '@/components/ui/KidSelect';

interface Props {
  defaultValues?: Partial<ScheduleSlot>;
  onSubmit: (values: ScheduleSlotCreate) => void | Promise<void>;
  submitLabel?: string;
}

export function ScheduleForm({ defaultValues, onSubmit, submitLabel = 'שמירה' }: Props) {
  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<ScheduleSlotCreate>({
    resolver: zodResolver(ScheduleSlotCreateSchema),
    defaultValues: {
      kidId: defaultValues?.kidId ?? '',
      day: defaultValues?.day ?? 1,
      lesson: defaultValues?.lesson ?? 1,
      subject: defaultValues?.subject ?? '',
      roomNum: defaultValues?.roomNum ?? '',
      teacher: defaultValues?.teacher ?? '',
    },
  });
  const kidId = watch('kidId');
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="label">ילד</label>
        <KidSelect value={kidId} onChange={(id) => setValue('kidId', id, { shouldValidate: true })} />
        {errors.kidId && <p className="text-xs text-red-600 mt-1">חובה לבחור ילד</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">יום</label>
          <select className="input" {...register('day', { valueAsNumber: true })}>
            <option value={1}>ראשון</option>
            <option value={2}>שני</option>
            <option value={3}>שלישי</option>
            <option value={4}>רביעי</option>
            <option value={5}>חמישי</option>
            <option value={6}>שישי</option>
            <option value={7}>שבת</option>
          </select>
        </div>
        <div>
          <label className="label">שיעור</label>
          <select className="input" {...register('lesson', { valueAsNumber: true })}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">מקצוע</label>
        <input className="input" {...register('subject')} />
      </div>
      <div>
        <label className="label">חדר</label>
        <input className="input" {...register('roomNum')} />
      </div>
      <div>
        <label className="label">מורה</label>
        <input className="input" {...register('teacher')} />
      </div>
      <button className="btn w-full justify-center" disabled={isSubmitting}>{submitLabel}</button>
    </form>
  );
}
