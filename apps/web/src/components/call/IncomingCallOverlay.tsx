'use client';

import { useEffect, useRef } from 'react';
import { useCall } from '@/lib/calls/call-context';
import { Ringer } from '@/lib/calls/ringer';

export function IncomingCallOverlay() {
  const { state, accept, decline } = useCall();
  const ringerRef = useRef<Ringer | null>(null);

  useEffect(() => {
    if (state.phase === 'incoming-ringing') {
      if (!ringerRef.current) ringerRef.current = new Ringer();
      ringerRef.current.start();
    } else {
      ringerRef.current?.stop();
    }
    return () => { ringerRef.current?.stop(); };
  }, [state.phase]);

  if (state.phase !== 'incoming-ringing') return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: 'rgba(20, 22, 28, 0.92)' }}
    >
      <div className="text-center text-white space-y-6 px-8">
        <div className="text-sm opacity-70">שיחה נכנסת</div>
        <div className="text-4xl font-bold">{state.callerName}</div>
        <div className="flex gap-6 justify-center pt-4">
          <button
            onClick={() => decline()}
            className="w-20 h-20 rounded-full text-white text-3xl"
            style={{ background: '#ef4444' }}
            aria-label="דחה"
          >
            ✕
          </button>
          <button
            onClick={() => accept()}
            className="w-20 h-20 rounded-full text-white text-3xl"
            style={{ background: '#22c55e' }}
            aria-label="ענה"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
