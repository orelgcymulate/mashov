'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { CallClient, type CallState } from './call-client';
import { primeAudio } from './ringer';
import type { DeviceRole } from '@mashov/shared';

interface Ctx {
  role: DeviceRole;
  state: CallState;
  initiate: (kidId: string, callerName?: string) => void;
  accept: () => Promise<void>;
  decline: () => void;
  hangup: () => void;
  reset: () => void;
}

const CallCtx = createContext<Ctx | null>(null);

export function CallProvider({
  role,
  apiUrl,
  children,
}: {
  role: DeviceRole;
  /** Public api origin, passed from the server layout. Empty string falls back to same-origin. */
  apiUrl?: string;
  children: ReactNode;
}) {
  const clientRef = useRef<CallClient | null>(null);
  const [state, setState] = useState<CallState>({ phase: 'idle' });

  useEffect(() => {
    // Create the shared AudioContext now + arm the user-gesture unlock so the
    // first nav/click in the dashboard primes it before any call arrives.
    primeAudio();

    const c = new CallClient(role);
    clientRef.current = c;
    // Direct WS to the api (Next.js's rewrites don't reliably proxy WebSocket
    // upgrades across machines). Server layout passes apiUrl from process.env;
    // we fall back to window.origin only when it's empty.
    const target = apiUrl && apiUrl.length > 0 ? apiUrl : window.location.origin;
    c.connect(target);
    const unsub = c.subscribe(setState);
    return () => { unsub(); c.hangup(); };
  }, [role, apiUrl]);

  const api: Ctx = {
    role,
    state,
    initiate: (kidId, callerName) => clientRef.current?.initiate(kidId, callerName),
    accept: () => clientRef.current?.accept() ?? Promise.resolve(),
    decline: () => clientRef.current?.decline(),
    hangup: () => clientRef.current?.hangup(),
    reset: () => clientRef.current?.reset(),
  };

  return <CallCtx.Provider value={api}>{children}</CallCtx.Provider>;
}

export function useCall(): Ctx {
  const v = useContext(CallCtx);
  if (!v) throw new Error('useCall outside CallProvider');
  return v;
}
