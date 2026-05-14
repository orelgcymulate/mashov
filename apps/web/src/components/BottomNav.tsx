'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS: { href: string; label: string; icon: string }[] = [
  { href: '/today', label: 'היום', icon: '🏠' },
  { href: '/tasks', label: 'משימות', icon: '✓' },
  { href: '/schedule', label: 'מערכת', icon: '📅' },
  { href: '/grades', label: 'ציונים', icon: '★' },
  { href: '/messages', label: 'הודעות', icon: '✉' },
  { href: '/behavior', label: 'התנהגות', icon: '⚑' },
  { href: '/notifications', label: 'התראות', icon: '🔔' },
  { href: '/kids', label: 'ילדים', icon: '👧' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto px-2 py-2 flex justify-around items-center">
        {ITEMS.map((it) => {
          const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs ${
                active ? 'text-black font-semibold' : ''
              }`}
              style={!active ? { color: 'var(--muted)' } : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-lg leading-none">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
