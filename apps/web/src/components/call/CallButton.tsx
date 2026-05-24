'use client';

import { useCall } from '@/lib/calls/call-context';

interface Props {
  kidId: string;
  kidName: string;
  kidColor: string;
}

/**
 * One-tap call button. Semantics flip based on device role:
 *  - phone  → calls the wall tablet, ring screen reads "הורה"
 *  - tablet → calls any registered phone, ring screen reads the kid's name
 */
export function CallButton({ kidId, kidName, kidColor }: Props) {
  const { state, initiate, role } = useCall();
  const disabled = state.phase !== 'idle' && state.phase !== 'ended';

  // On the tablet we send the kid's name so the parent's phone sees who's
  // calling; on the phone we let the server default to 'הורה'.
  const onClick = (): void => {
    initiate(kidId, role === 'tablet' ? kidName : undefined);
  };

  const label = role === 'tablet' ? `קרא להורה (${kidName})` : `התקשר ל${kidName}`;
  const visibleText = role === 'tablet' ? '📞 קרא להורה' : '📞 התקשר';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="call-button"
      style={{ background: kidColor, opacity: disabled ? 0.5 : 1 }}
      aria-label={label}
    >
      {visibleText}
    </button>
  );
}
