'use client';

import { useEffect, useRef, useState } from 'react';
import { useCall } from '@/lib/calls/call-context';

export function CallView() {
  const { state, hangup } = useCall();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => {
    if (state.phase === 'in-call') {
      if (localRef.current) localRef.current.srcObject = state.localStream;
      if (remoteRef.current) remoteRef.current.srcObject = state.remoteStream;
    }
  }, [state]);

  if (state.phase !== 'connecting' && state.phase !== 'in-call' && state.phase !== 'outgoing-ringing') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black text-white">
      {state.phase === 'in-call' && (
        <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      )}
      <video
        ref={localRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-4 right-4 w-40 aspect-[3/4] rounded-xl object-cover border-2 border-white/30"
      />
      {state.phase !== 'in-call' && (
        <div className="absolute inset-0 grid place-items-center text-2xl opacity-80">
          {state.phase === 'outgoing-ringing' ? 'מתקשר…' : 'מתחבר…'}
        </div>
      )}
      <div className="absolute bottom-6 inset-x-0 flex gap-4 justify-center">
        <ToggleButton
          on={!muted}
          onClick={() => {
            setMuted((m) => !m);
            if (state.phase === 'in-call') {
              state.localStream.getAudioTracks().forEach((t) => (t.enabled = muted));
            }
          }}
          label={muted ? 'בטל השתקה' : 'השתקה'}
        >
          {muted ? '🔇' : '🎤'}
        </ToggleButton>
        <button
          onClick={() => hangup()}
          className="w-16 h-16 rounded-full text-2xl"
          style={{ background: '#ef4444' }}
          aria-label="סיים שיחה"
        >
          ✕
        </button>
        <ToggleButton
          on={!camOff}
          onClick={() => {
            setCamOff((c) => !c);
            if (state.phase === 'in-call') {
              state.localStream.getVideoTracks().forEach((t) => (t.enabled = camOff));
            }
          }}
          label={camOff ? 'הפעל מצלמה' : 'כבה מצלמה'}
        >
          {camOff ? '🚫' : '📹'}
        </ToggleButton>
      </div>
    </div>
  );
}

function ToggleButton({ on, onClick, label, children }: {
  on: boolean; onClick: () => void; label: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-16 h-16 rounded-full text-2xl"
      style={{ background: on ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)' }}
    >
      {children}
    </button>
  );
}
