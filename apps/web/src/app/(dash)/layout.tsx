import { ReactNode } from 'react';
import { KidProvider } from '@/lib/kid-context';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { CallProvider } from '@/lib/calls/call-context';
import { IncomingCallOverlay } from '@/components/call/IncomingCallOverlay';
import { CallView } from '@/components/call/CallView';
import { DeviceRoleSetter } from '@/components/call/DeviceRoleSetter';
import { cookies } from 'next/headers';

export default function DashLayout({ children }: { children: ReactNode }) {
  // Role persists via a cookie set client-side by <DeviceRoleSetter> when the
  // URL carries ?device=tablet. Defaults to 'phone' everywhere else.
  const role = cookies().get('mashov_device')?.value === 'tablet' ? 'tablet' : 'phone';
  // Pass the api origin to the client so the call-client can open a direct
  // WebSocket to it (Next.js rewrites don't carry WS upgrades reliably).
  // process.env.API_URL is the same value the next.config rewrites use.
  const apiUrl = process.env.API_URL ?? '';
  return (
    <KidProvider>
      <CallProvider role={role} apiUrl={apiUrl}>
        <DeviceRoleSetter />
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
