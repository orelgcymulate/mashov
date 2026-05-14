'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Notification, NotificationCreate, NotificationCreateSchema } from '@mashov/shared';
import { KidSelect } from '@/components/ui/KidSelect';

interface Props {
  defaultValues?: Partial<Notification>;
  onSubmit: (values: NotificationCreate) => void | Promise<void>;
  submitLabel?: string;
}

function toDateInput(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function NotificationForm({ defaultValues, onSubmit, submitLabel = 'שמירה' }: Props) {
  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<NotificationCreate>({
    resolver: zodResolver(NotificationCreateSchema),
    defaultValues: {
      kidId: defaultValues?.kidId ?? '',
      text: defaultValues?.text ?? '',
      date: defaultValues?.date ?? new Date().toISOString(),
      isNew: defaultValues?.isNew ?? true,
    },
  });
  const kidId = watch('kidId');
  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ ...v, date: new Date(v.date).toISOString() }))}
      className="space-y-3"
    >
      <div>
        <label className="label">ילד</label>
        <KidSelect value={kidId} onChange={(id) => setValue('kidId', id, { shouldValidate: true })} />
        {errors.kidId && <p className="text-xs text-red-600 mt-1">חובה לבחור ילד</p>}
      </div>
      <div>
        <label className="label">תוכן</label>
        <input className="input" {...register('text')} />
      </div>
      <div>
        <label className="label">תאריך</label>
        <input className="input" type="date" defaultValue={toDateInput(defaultValues?.date)} {...register('date')} />
      </div>
      <label className="label flex items-center gap-2">
        <input type="checkbox" {...register('isNew')} />
        חדשה
      </label>
      <button className="btn w-full justify-center" disabled={isSubmitting}>{submitLabel}</button>
    </form>
  );
}
