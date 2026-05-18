'use client';

import { useCall } from '@/lib/calls/call-context';

export function CallButton({ kidId, kidName, kidColor }: { kidId: string; kidName: string; kidColor: string }) {
  const { state, initiate } = useCall();
  const disabled = state.phase !== 'idle' && state.phase !== 'ended';
  return (
    <button
      onClick={() => initiate(kidId)}
      disabled={disabled}
      className="px-3 py-1.5 rounded-full text-white text-sm font-semibold"
      style={{ background: kidColor, opacity: disabled ? 0.5 : 1 }}
      aria-label={`התקשר ל${kidName}`}
    >
      📞 התקשר
    </button>
  );
}
