'use client';

import { useKidCtx } from '@/lib/kid-context';

interface Props {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function KidSelect({ value, onChange, disabled }: Props) {
  const { kids } = useKidCtx();
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
    >
      <option value="">— בחר ילד —</option>
      {kids.map((k) => (
        <option key={k._id} value={k._id}>
          {k.name}
        </option>
      ))}
    </select>
  );
}
