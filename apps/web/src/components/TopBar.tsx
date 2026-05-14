'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useKidCtx } from '@/lib/kid-context';
import { api } from '@/lib/api-client';
import { HE_DAYS, HE_MONTHS } from '@mashov/shared';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { kids, activeKidId, setActiveKidId } = useKidCtx();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function logout() {
    await api.post('/api/auth/logout', {});
    router.push('/login');
  }

  const dayLabel = `יום ${HE_DAYS[now.getDay()]}, ${now.getDate()} ${HE_MONTHS[now.getMonth()]}`;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const showAllTab = kids.length > 1;

  return (
    <header className="border-b bg-white" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{clock}</span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{dayLabel}</span>
        </div>

        <div className="flex-1" />

        {kids.length > 0 && (
          <div className="flex gap-1" role="tablist" aria-label="תצוגה">
            {showAllTab && (
              <TabButton selected={activeKidId === 'all'} onClick={() => setActiveKidId('all')}>
                שניהם
              </TabButton>
            )}
            {kids.map((k) => (
              <TabButton key={k._id} selected={activeKidId === k._id} onClick={() => setActiveKidId(k._id)}>
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: k.color, marginInlineEnd: 6 }}
                />
                {k.name}
              </TabButton>
            ))}
          </div>
        )}

        <button
          onClick={logout}
          className="btn-ghost btn"
          aria-label="התנתק"
          title="התנתק"
          // keep pathname for type completeness (avoid unused warning)
          data-path={pathname}
        >
          ⎋
        </button>
      </div>
    </header>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border ${
        selected ? 'bg-black text-white border-black' : 'bg-white text-black'
      }`}
      style={selected ? undefined : { borderColor: 'var(--border)' }}
    >
      {children}
    </button>
  );
}
