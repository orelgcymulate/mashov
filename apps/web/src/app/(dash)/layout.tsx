import { ReactNode } from 'react';
import { KidProvider } from '@/lib/kid-context';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';

export default function DashLayout({ children }: { children: ReactNode }) {
  return (
    <KidProvider>
      <div className="tablet-frame">
        <TopBar />
        <main className="pb-28 pt-3 space-y-4">{children}</main>
        <BottomNav />
      </div>
    </KidProvider>
  );
}
