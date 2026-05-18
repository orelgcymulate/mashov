'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookIcon,
  GridIcon,
  CalendarIcon,
  CheckSquareIcon,
  SparkleIcon,
} from '@/components/icons';
import type { SVGProps } from 'react';

type Item = {
  href: string;
  label: string;
  Icon: (p: SVGProps<SVGSVGElement>) => JSX.Element;
};

// RTL: first item appears rightmost (closest to "Home" in the photo)
const ITEMS: Item[] = [
  { href: '/today', label: 'היום', Icon: HomeIcon },
  { href: '/lessons', label: 'שיעורים', Icon: BookIcon },
  { href: '/schedule', label: 'מערכת', Icon: GridIcon },
  { href: '/journal', label: 'יומן', Icon: CalendarIcon },
  { href: '/tasks', label: 'משימות', Icon: CheckSquareIcon },
  { href: '/insights', label: 'תובנות', Icon: SparkleIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="nav-bar fixed bottom-0 inset-x-0" aria-label="ניווט ראשי">
      <div className="tablet-frame">
        <div className="flex justify-around items-center gap-1 py-2">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? 'nav-item--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
