import { ReactNode } from 'react';
import { KidProvider } from '@/lib/kid-context';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';

export default function DashLayout({ children }: { children: ReactNode }) {
  return (
    <KidProvider>
      <TopBar />
      <main className="max-w-5xl mx-auto px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </KidProvider>
  );
}
