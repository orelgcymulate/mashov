'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Grade, GradeCreate, GradeCreateSchema } from '@mashov/shared';
import { KidSelect } from '@/components/ui/KidSelect';

interface Props {
  defaultValues?: Partial<Grade>;
  onSubmit: (values: GradeCreate) => void | Promise<void>;
  submitLabel?: string;
}

function toDateInput(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function GradeForm({ defaultValues, onSubmit, submitLabel = 'שמירה' }: Props) {
  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<GradeCreate>({
    resolver: zodResolver(GradeCreateSchema),
    defaultValues: {
      kidId: defaultValues?.kidId ?? '',
      subject: defaultValues?.subject ?? '',
      event: defaultValues?.event ?? '',
      grade: defaultValues?.grade ?? 0,
      gradeType: defaultValues?.gradeType ?? 'מבחן',
      eventDate: defaultValues?.eventDate ?? new Date().toISOString(),
      teacherName: defaultValues?.teacherName ?? '',
    },
  });
  const kidId = watch('kidId');
  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ ...v, eventDate: new Date(v.eventDate).toISOString() }))}
      className="space-y-3"
    >
      <div>
        <label className="label">ילד</label>
        <KidSelect value={kidId} onChange={(id) => setValue('kidId', id, { shouldValidate: true })} />
        {errors.kidId && <p className="text-xs text-red-600 mt-1">חובה לבחור ילד</p>}
      </div>
      <div>
        <label className="label">מקצוע</label>
        <input className="input" {...register('subject')} />
      </div>
      <div>
        <label className="label">אירוע</label>
        <input className="input" {...register('event')} placeholder="למשל: מבחן שברים" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">ציון</label>
          <input className="input" type="number" min={0} max={100} {...register('grade', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="label">סוג</label>
          <input className="input" {...register('gradeType')} placeholder="מבחן/בוחן/פרויקט" />
        </div>
      </div>
      <div>
        <label className="label">תאריך</label>
        <input className="input" type="date" defaultValue={toDateInput(defaultValues?.eventDate)} {...register('eventDate')} />
      </div>
      <div>
        <label className="label">מורה (לא חובה)</label>
        <input className="input" {...register('teacherName')} />
      </div>
      <button className="btn w-full justify-center" disabled={isSubmitting}>{submitLabel}</button>
    </form>
  );
}
