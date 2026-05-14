'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Message, MessageCreate, MessageCreateSchema } from '@mashov/shared';
import { KidSelect } from '@/components/ui/KidSelect';

interface Props {
  defaultValues?: Partial<Message>;
  onSubmit: (values: MessageCreate) => void | Promise<void>;
  submitLabel?: string;
}

function toDateInput(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function MessageForm({ defaultValues, onSubmit, submitLabel = 'שמירה' }: Props) {
  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<MessageCreate>({
    resolver: zodResolver(MessageCreateSchema),
    defaultValues: {
      kidId: defaultValues?.kidId ?? '',
      subject: defaultValues?.subject ?? '',
      sender: defaultValues?.sender ?? '',
      body: defaultValues?.body ?? '',
      sentAt: defaultValues?.sentAt ?? new Date().toISOString(),
      isNew: defaultValues?.isNew ?? true,
    },
  });
  const kidId = watch('kidId');
  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ ...v, sentAt: new Date(v.sentAt).toISOString() }))}
      className="space-y-3"
    >
      <div>
        <label className="label">ילד</label>
        <KidSelect value={kidId} onChange={(id) => setValue('kidId', id, { shouldValidate: true })} />
        {errors.kidId && <p className="text-xs text-red-600 mt-1">חובה לבחור ילד</p>}
      </div>
      <div>
        <label className="label">נושא</label>
        <input className="input" {...register('subject')} />
      </div>
      <div>
        <label className="label">שולח</label>
        <input className="input" {...register('sender')} />
      </div>
      <div>
        <label className="label">תוכן (לא חובה)</label>
        <textarea className="input min-h-[100px]" {...register('body')} />
      </div>
      <div>
        <label className="label">תאריך</label>
        <input className="input" type="date" defaultValue={toDateInput(defaultValues?.sentAt)} {...register('sentAt')} />
      </div>
      <label className="label flex items-center gap-2">
        <input type="checkbox" {...register('isNew')} />
        חדשה
      </label>
      <button className="btn w-full justify-center" disabled={isSubmitting}>{submitLabel}</button>
    </form>
  );
}
