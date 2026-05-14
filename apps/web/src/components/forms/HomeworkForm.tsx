'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HomeworkCreate, HomeworkCreateSchema, Homework } from '@mashov/shared';
import { KidSelect } from '@/components/ui/KidSelect';

type FormValues = HomeworkCreate;

interface Props {
  defaultValues?: Partial<Homework>;
  onSubmit: (values: HomeworkCreate) => void | Promise<void>;
  submitLabel?: string;
}

function toDateInput(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function HomeworkForm({ defaultValues, onSubmit, submitLabel = 'שמירה' }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(HomeworkCreateSchema),
    defaultValues: {
      kidId: defaultValues?.kidId ?? '',
      subject: defaultValues?.subject ?? '',
      homework: defaultValues?.homework ?? '',
      lessonDate: defaultValues?.lessonDate ?? new Date().toISOString(),
      teacherName: defaultValues?.teacherName ?? '',
      done: defaultValues?.done ?? false,
    },
  });

  const kidId = watch('kidId');

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({ ...values, lessonDate: new Date(values.lessonDate).toISOString() }),
      )}
      className="space-y-3"
    >
      <div>
        <label className="label">ילד</label>
        <KidSelect value={kidId} onChange={(id) => setValue('kidId', id, { shouldValidate: true })} />
        {errors.kidId && <p className="text-xs text-red-600 mt-1">חובה לבחור ילד</p>}
      </div>
      <div>
        <label className="label">מקצוע</label>
        <input className="input" {...register('subject')} placeholder="למשל: חשבון" />
      </div>
      <div>
        <label className="label">המשימה</label>
        <textarea className="input min-h-[80px]" {...register('homework')} placeholder="תיאור" />
      </div>
      <div>
        <label className="label">תאריך השיעור</label>
        <input
          className="input"
          type="date"
          defaultValue={toDateInput(defaultValues?.lessonDate)}
          {...register('lessonDate')}
        />
      </div>
      <div>
        <label className="label">מורה (לא חובה)</label>
        <input className="input" {...register('teacherName')} />
      </div>
      <button className="btn w-full justify-center" disabled={isSubmitting}>
        {isSubmitting ? 'שומר…' : submitLabel}
      </button>
    </form>
  );
}
