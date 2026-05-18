import { ReactNode } from 'react';
import { KidProvider } from '@/lib/kid-context';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { CallProvider } from '@/lib/calls/call-context';
import { IncomingCallOverlay } from '@/components/call/IncomingCallOverlay';
import { CallView } from '@/components/call/CallView';
import { headers } from 'next/headers';

export default function DashLayout({ children }: { children: ReactNode }) {
  const referer = headers().get('referer') ?? '';
  const role = referer.includes('device=tablet') ? 'tablet' : 'phone';
  return (
    <KidProvider>
      <CallProvider role={role}>
        <div className="tablet-frame">
          <TopBar />
          <main className="pb-28 pt-3 space-y-4">{children}</main>
          <BottomNav />
        </div>
        <IncomingCallOverlay />
        <CallView />
      </CallProvider>
    </KidProvider>
  );
}
