'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Behavior, BehaviorCreate, BehaviorCreateSchema } from '@mashov/shared';
import { KidSelect } from '@/components/ui/KidSelect';

interface Props {
  defaultValues?: Partial<Behavior>;
  onSubmit: (values: BehaviorCreate) => void | Promise<void>;
  submitLabel?: string;
}

function toDateInput(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function BehaviorForm({ defaultValues, onSubmit, submitLabel = 'שמירה' }: Props) {
  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<BehaviorCreate>({
    resolver: zodResolver(BehaviorCreateSchema),
    defaultValues: {
      kidId: defaultValues?.kidId ?? '',
      subject: defaultValues?.subject ?? '',
      eventType: defaultValues?.eventType ?? 'ציון לשבח',
      note: defaultValues?.note ?? '',
      date: defaultValues?.date ?? new Date().toISOString(),
      justified: defaultValues?.justified ?? true,
      teacherName: defaultValues?.teacherName ?? '',
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
        <label className="label">סוג אירוע</label>
        <input className="input" {...register('eventType')} placeholder="ציון לשבח / איחור / שיעורי בית חסרים" />
      </div>
      <div>
        <label className="label">מקצוע</label>
        <input className="input" {...register('subject')} />
      </div>
      <div>
        <label className="label">הערה</label>
        <textarea className="input min-h-[80px]" {...register('note')} />
      </div>
      <div>
        <label className="label">תאריך</label>
        <input className="input" type="date" defaultValue={toDateInput(defaultValues?.date)} {...register('date')} />
      </div>
      <div>
        <label className="label flex items-center gap-2">
          <input type="checkbox" {...register('justified')} />
          מוצדק
        </label>
      </div>
      <div>
        <label className="label">מורה (לא חובה)</label>
        <input className="input" {...register('teacherName')} />
      </div>
      <button className="btn w-full justify-center" disabled={isSubmitting}>{submitLabel}</button>
    </form>
  );
}
