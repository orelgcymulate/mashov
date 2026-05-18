import { z } from 'zod';

// Roles. The wall tablet identifies as 'tablet' on connect; everything else is 'phone'.
export const DeviceRoleSchema = z.enum(['tablet', 'phone']);
export type DeviceRole = z.infer<typeof DeviceRoleSchema>;

// One active call has a server-issued id. Format: `${nanoTime}-${rand}` — opaque to clients.
export const CallIdSchema = z.string().min(1);

// --- client → server ---

export const InitiateCallSchema = z.object({
  // Which kid this call is for (used as ring metadata; routing is role-based).
  kidId: z.string().regex(/^[a-fA-F0-9]{24}$/),
});
export type InitiateCallPayload = z.infer<typeof InitiateCallSchema>;

export const CallIdPayloadSchema = z.object({ callId: CallIdSchema });
export type CallIdPayload = z.infer<typeof CallIdPayloadSchema>;

// SDP and ICE blobs are forwarded opaquely. Server never inspects them.
export const SignalSchema = z.object({
  callId: CallIdSchema,
  // 'offer' | 'answer' | 'ice' — distinguished only so the client can route.
  kind: z.enum(['offer', 'answer', 'ice']),
  data: z.unknown(),
});
export type SignalPayload = z.infer<typeof SignalSchema>;

// --- server → client ---

export const IncomingCallSchema = z.object({
  callId: CallIdSchema,
  kidId: z.string(),
  callerName: z.string(),
});
export type IncomingCallPayload = z.infer<typeof IncomingCallSchema>;

export const CallEndedSchema = z.object({
  callId: CallIdSchema,
  reason: z.enum(['hangup', 'declined', 'caller_left', 'callee_left', 'no_tablet', 'error']),
});
export type CallEndedPayload = z.infer<typeof CallEndedSchema>;

// Event names — single source of truth, used by both ends.
export const CALL_EVENTS = {
  initiate: 'call:initiate',
  accept: 'call:accept',
  decline: 'call:decline',
  hangup: 'call:hangup',
  signal: 'call:signal',
  incoming: 'call:incoming',
  outgoing: 'call:outgoing',     // ack to caller: tablet is being rung
  accepted: 'call:accepted',
  declined: 'call:declined',
  ended: 'call:ended',
} as const;
