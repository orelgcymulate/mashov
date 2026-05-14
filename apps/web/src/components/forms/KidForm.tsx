'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Kid, KidCreate, KidCreateSchema } from '@mashov/shared';

interface Props {
  defaultValues?: Partial<Kid>;
  onSubmit: (values: KidCreate) => void | Promise<void>;
  submitLabel?: string;
}

export function KidForm({ defaultValues, onSubmit, submitLabel = 'שמירה' }: Props) {
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<KidCreate>({
    resolver: zodResolver(KidCreateSchema),
    defaultValues: {
      slug: defaultValues?.slug ?? '',
      name: defaultValues?.name ?? '',
      color: defaultValues?.color ?? '#3a86ff',
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="label">שם</label>
        <input className="input" {...register('name')} placeholder="למשל: איילה" />
        {errors.name && <p className="text-xs text-red-600 mt-1">חובה להזין שם</p>}
      </div>
      <div>
        <label className="label">מזהה (אנגלית, ללא רווחים)</label>
        <input className="input" {...register('slug')} placeholder="ayala" />
        {errors.slug && <p className="text-xs text-red-600 mt-1">אותיות קטנות, ספרות, מקפים בלבד</p>}
      </div>
      <div>
        <label className="label">צבע</label>
        <input className="input h-12 p-1" type="color" {...register('color')} />
      </div>
      <button className="btn w-full justify-center" disabled={isSubmitting}>{submitLabel}</button>
    </form>
  );
}
