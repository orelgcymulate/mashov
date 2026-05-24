'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DeviceRole } from '@mashov/shared';

const COOKIE = 'mashov_device';
const TABLET_AGE = 60 * 60 * 24 * 365 * 5; // 5 years

function readRole(): DeviceRole {
  if (typeof document === 'undefined') return 'phone';
  return document.cookie.split('; ').some((c) => c === `${COOKIE}=tablet`) ? 'tablet' : 'phone';
}

export default function SettingsPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<DeviceRole>('phone');

  useEffect(() => {
    setCurrent(readRole());
  }, []);

  const choose = (role: DeviceRole): void => {
    if (role === 'tablet') {
      document.cookie = `${COOKIE}=tablet; path=/; max-age=${TABLET_AGE}; samesite=lax`;
    } else {
      // Expire the cookie so the server-side layout falls back to 'phone'.
      document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
    }
    // Full reload so (dash)/layout re-reads the cookie and the CallProvider
    // opens a fresh WebSocket with the new role.
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">סוג המכשיר</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          המכשיר הזה משמש כ-<strong>{current === 'tablet' ? 'טאבלט על הקיר' : 'טלפון של ההורה'}</strong>.
          בחר תפקיד אחר אם רוצים להחליף.
        </p>
      </header>

      <RoleCard
        title="📺 טאבלט על הקיר"
        body="מקבל שיחות נכנסות. הילדים יכולים גם להתקשר להורים מהטאבלט."
        selected={current === 'tablet'}
        onClick={() => choose('tablet')}
      />

      <RoleCard
        title="📱 טלפון של ההורה"
        body="מתקשר לטאבלט שבבית. רואה את הילדים בדשבורד ויכול להתחיל שיחה."
        selected={current === 'phone'}
        onClick={() => choose('phone')}
      />

      <div className="text-xs pt-4" style={{ color: 'var(--muted)' }}>
        ההגדרה נשמרת ב-cookie על המכשיר הזה. ניתן לשנות בכל רגע.
      </div>

      <button
        onClick={() => router.back()}
        className="btn-ghost btn w-full justify-center mt-2"
      >
        חזור
      </button>
    </div>
  );
}

function RoleCard({
  title,
  body,
  selected,
  onClick,
}: {
  title: string;
  body: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card p-4 w-full text-right"
      style={{
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        borderWidth: selected ? 2 : 1,
        background: selected ? 'var(--accent-soft)' : 'var(--card)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-bold">{title}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{body}</div>
        </div>
        {selected && (
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>✓ פעיל</span>
        )}
      </div>
    </button>
  );
}
