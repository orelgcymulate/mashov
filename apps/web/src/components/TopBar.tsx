'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKidCtx } from '@/lib/kid-context';
import { api } from '@/lib/api-client';
import { HE_DAYS, HE_MONTHS } from '@mashov/shared';
import { partOfDay, pad2 } from '@/lib/he';
import Link from 'next/link';
import { SunIcon, LogoutIcon, SettingsIcon } from '@/components/icons';

const WEATHER_LABEL = process.env.NEXT_PUBLIC_WEATHER_LABEL ?? '23° בהיר';

export function TopBar() {
  const router = useRouter();
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

  const day = HE_DAYS[now.getDay()];
  const dayLabel = `יום ${day}, ${now.getDate()} ${HE_MONTHS[now.getMonth()]}`;
  const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const pod = partOfDay(now);
  const showAllTab = kids.length > 1;

  return (
    <header className="pt-3 pb-3">
      <div className="flex items-start gap-4">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <span className="pill pill-weather" aria-label={`מזג אוויר: ${WEATHER_LABEL}`}>
            <SunIcon width={14} height={14} />
            {WEATHER_LABEL}
          </span>

          {kids.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="תצוגה">
              {showAllTab && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeKidId === 'all'}
                  onClick={() => setActiveKidId('all')}
                  className="pill pill-kid"
                >
                  שניהם
                </button>
              )}
              {kids.map((k) => (
                <button
                  key={k._id}
                  type="button"
                  role="tab"
                  aria-selected={activeKidId === k._id}
                  onClick={() => setActiveKidId(k._id)}
                  className="pill pill-kid"
                >
                  <span className="pill-dot" style={{ background: k.color }} aria-hidden />
                  {k.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          <span className="pill pill-time-of-day">{pod.label}</span>
          <div className="text-5xl font-extrabold tabular-nums leading-none">{clock}</div>
          <div className="text-sm" style={{ color: 'var(--fg)' }}>{dayLabel}</div>
          <div className="flex items-center gap-3 mt-1">
            <Link
              href="/settings"
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--muted)' }}
              aria-label="הגדרות"
              title="הגדרות"
            >
              <SettingsIcon width={14} height={14} /> הגדרות
            </Link>
            <button
              onClick={logout}
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--muted)' }}
              aria-label="התנתק"
              title="התנתק"
            >
              <LogoutIcon width={14} height={14} /> התנתק
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
