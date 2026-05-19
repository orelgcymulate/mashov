'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { CallClient, type CallState } from './call-client';
import type { DeviceRole } from '@mashov/shared';

interface Ctx {
  state: CallState;
  initiate: (kidId: string) => void;
  accept: () => Promise<void>;
  decline: () => void;
  hangup: () => void;
  reset: () => void;
}

const CallCtx = createContext<Ctx | null>(null);

export function CallProvider({ role, children }: { role: DeviceRole; children: ReactNode }) {
  const clientRef = useRef<CallClient | null>(null);
  const [state, setState] = useState<CallState>({ phase: 'idle' });

  useEffect(() => {
    const c = new CallClient(role);
    clientRef.current = c;
    // Prefer the public API URL (cross-origin direct WS) and fall back to
    // same-origin for local dev where both apps share localhost.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? window.location.origin;
    c.connect(apiUrl);
    const unsub = c.subscribe(setState);
    return () => { unsub(); c.hangup(); };
  }, [role]);

  const api: Ctx = {
    state,
    initiate: (kidId) => clientRef.current?.initiate(kidId),
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
