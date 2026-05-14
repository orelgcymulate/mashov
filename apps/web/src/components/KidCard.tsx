'use client';

import { ReactNode } from 'react';
import type { Kid } from '@mashov/shared';
import { tint } from '@/lib/dates';

interface Props {
  kid: Kid;
  title: string;
  sub?: string;
  count?: string;
  children?: ReactNode;
}

export function KidCard({ kid, title, sub, count, children }: Props) {
  return (
    <section
      className="card overflow-hidden"
      style={{ ['--kid-color' as string]: kid.color, ['--kid-color-soft' as string]: tint(kid.color) }}
    >
      <header
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: tint(kid.color), borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-full grid place-items-center text-white font-bold"
          style={{ background: kid.color }}
          aria-hidden
        >
          {kid.name[0]}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {sub && <div className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</div>}
        </div>
        {count && <div className="text-sm font-medium">{count}</div>}
      </header>
      <div className="p-3 space-y-2">{children}</div>
    </section>
  );
}
