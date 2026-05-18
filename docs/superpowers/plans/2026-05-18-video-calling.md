# Video Calling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 1:1 WebRTC video calling between the parent's phone (caller) and the wall-mounted Android tablet (callee), fully self-hosted on the existing Railway deploy with no third-party video services.

**Architecture:** WebSocket signaling lives inside the existing NestJS API as a Socket.io gateway — same process, same Railway service, auth via the existing JWT cookie. Browsers handle media themselves through native `RTCPeerConnection` + `getUserMedia`; signaling only relays SDP offer/answer + ICE candidates. STUN uses Google's public servers (free, sufficient when both peers are on home Wi-Fi or one is on cellular with friendly NAT). TURN is deliberately deferred — add a coturn on Oracle Cloud free tier (or any tiny VPS) only if real-world calls fail to connect.

**Tech Stack:** NestJS 10 (`@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io`), Next.js 14 App Router, `socket.io-client`, native browser WebRTC, Zod schemas in `@mashov/shared`.

---

## File Structure

**Shared types**
- Create: `packages/shared/src/calls.ts` — zod schemas + TS types for every signaling event.
- Modify: `packages/shared/src/index.ts` — re-export.

**Backend (NestJS)**
- Create: `apps/api/src/modules/calls/calls.module.ts`
- Create: `apps/api/src/modules/calls/calls.gateway.ts` — Socket.io handlers (one per event).
- Create: `apps/api/src/modules/calls/calls.service.ts` — in-memory registry of connected devices + active calls.
- Create: `apps/api/src/modules/calls/ws-auth.ts` — pure function that pulls the cookie off the handshake and verifies JWT.
- Modify: `apps/api/src/app.module.ts` — register `CallsModule`.
- Modify: `apps/api/package.json` — add `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`.

**Backend tests**
- Create: `apps/api/test/calls.gateway.e2e-spec.ts` — boots a Nest app, two real `socket.io-client` instances act as tablet + phone.

**Frontend (Next.js)**
- Create: `apps/web/src/lib/calls/call-client.ts` — class wrapping the Socket.io connection + `RTCPeerConnection` state machine.
- Create: `apps/web/src/lib/calls/call-context.tsx` — React context exposing call state + `start()` / `accept()` / `decline()` / `hangup()`.
- Create: `apps/web/src/components/call/IncomingCallOverlay.tsx` — full-screen ring (callee side).
- Create: `apps/web/src/components/call/CallView.tsx` — local + remote video, mic/cam toggle, end button.
- Create: `apps/web/src/components/call/CallButton.tsx` — call trigger (caller side).
- Modify: `apps/web/src/app/(dash)/layout.tsx` — wrap children in `<CallProvider>` and render `<IncomingCallOverlay />` + `<CallView />`.
- Modify: `apps/web/src/app/(dash)/today/page.tsx` — add a `<CallButton />` per kid tile.
- Modify: `apps/web/package.json` — add `socket.io-client`.

**Frontend tests**
- Manual browser test only. `RTCPeerConnection` and `getUserMedia` aren't realistically unit-testable without a headless browser + fake media streams; the gateway tests cover the signaling protocol, the UI is verified with two browser tabs.

---

## Task 1: Add deps and shared signaling types

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Create: `packages/shared/src/calls.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Install backend deps**

```bash
npm install -w @mashov/api @nestjs/websockets@^10.4.0 @nestjs/platform-socket.io@^10.4.0 socket.io@^4.7.5
```

Expected: three packages added to `apps/api/package.json` under `dependencies`.

- [ ] **Step 2: Install frontend deps**

```bash
npm install -w @mashov/web socket.io-client@^4.7.5
```

- [ ] **Step 3: Define signaling event schemas**

Create `packages/shared/src/calls.ts`:

```ts
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
```

- [ ] **Step 4: Re-export from the package index**

Add to `packages/shared/src/index.ts`:

```ts
export * from './calls';
```

- [ ] **Step 5: Verify it compiles**

```bash
npm run -w @mashov/shared build && npm run -ws --if-present typecheck
```

Expected: clean exit. The shared package's `dist/` now contains `calls.js` + `calls.d.ts`.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/calls.ts packages/shared/src/index.ts apps/api/package.json apps/web/package.json package-lock.json
git commit -m "feat(calls): add signaling event schemas + socket.io deps"
```

---

## Task 2: WebSocket handshake auth

**Files:**
- Create: `apps/api/src/modules/calls/ws-auth.ts`
- Create: `apps/api/test/ws-auth.spec.ts`

Reuse the existing JWT cookie. Socket.io exposes `socket.handshake.headers.cookie`; we parse it ourselves (no `cookie-parser` in the WS path) and `JwtService.verify` the value.

- [ ] **Step 1: Write the failing test**

Create `apps/api/test/ws-auth.spec.ts`:

```ts
import { JwtService } from '@nestjs/jwt';
import { authenticateHandshake } from '../src/modules/calls/ws-auth';

describe('authenticateHandshake', () => {
  const jwt = new JwtService({ secret: 'test-secret' });

  it('returns the user payload when cookie holds a valid JWT', () => {
    const token = jwt.sign({ sub: 'user-1' });
    const user = authenticateHandshake(`mashov_session=${token}; other=1`, jwt);
    expect(user).toEqual({ sub: 'user-1' });
  });

  it('returns null when no cookie header', () => {
    expect(authenticateHandshake(undefined, jwt)).toBeNull();
  });

  it('returns null when the session cookie is missing', () => {
    expect(authenticateHandshake('other=1', jwt)).toBeNull();
  });

  it('returns null when the JWT is invalid', () => {
    expect(authenticateHandshake('mashov_session=garbage', jwt)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test (expect compile failure)**

```bash
npm test -w @mashov/api -- --testPathPattern=ws-auth
```

Expected: fails because `ws-auth.ts` does not exist yet.

- [ ] **Step 3: Implement**

Create `apps/api/src/modules/calls/ws-auth.ts`:

```ts
import { JwtService } from '@nestjs/jwt';
import { SESSION_COOKIE } from '../auth/jwt-auth.guard';

export interface SocketUser {
  sub: string;
}

export function authenticateHandshake(
  cookieHeader: string | undefined,
  jwt: JwtService,
): SocketUser | null {
  if (!cookieHeader) return null;
  const token = parseCookie(cookieHeader, SESSION_COOKIE);
  if (!token) return null;
  try {
    const payload = jwt.verify<SocketUser>(token);
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}
```

- [ ] **Step 4: Run the test — should pass**

```bash
npm test -w @mashov/api -- --testPathPattern=ws-auth
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/calls/ws-auth.ts apps/api/test/ws-auth.spec.ts
git commit -m "feat(calls): JWT handshake auth helper for socket.io"
```

---

## Task 3: CallsService — in-memory device + call registry

**Files:**
- Create: `apps/api/src/modules/calls/calls.service.ts`
- Create: `apps/api/test/calls.service.spec.ts`

Pure data layer — no Socket.io references. Two maps: `userId → role → socketId` and `callId → Call`. Easy to unit-test.

- [ ] **Step 1: Write failing tests**

Create `apps/api/test/calls.service.spec.ts`:

```ts
import { CallsService } from '../src/modules/calls/calls.service';

describe('CallsService', () => {
  let svc: CallsService;
  beforeEach(() => { svc = new CallsService(); });

  it('tracks tablet and phone sockets per user', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.registerSocket('u1', 'phone', 's-phone');

    expect(svc.tabletSocketFor('u1')).toBe('s-tab');
    expect(svc.phoneSocketsFor('u1')).toEqual(['s-phone']);
  });

  it('drops sockets on unregister', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.unregisterSocket('s-tab');
    expect(svc.tabletSocketFor('u1')).toBeNull();
  });

  it('starts a call and resolves caller/callee sockets', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.registerSocket('u1', 'phone', 's-phone');

    const call = svc.startCall({ userId: 'u1', callerSocketId: 's-phone', kidId: 'k1' });

    expect(call.id).toBeDefined();
    expect(call.calleeSocketId).toBe('s-tab');
    expect(call.callerSocketId).toBe('s-phone');
    expect(svc.callById(call.id)).toEqual(call);
  });

  it('refuses to start a call when no tablet is online', () => {
    svc.registerSocket('u1', 'phone', 's-phone');
    expect(() =>
      svc.startCall({ userId: 'u1', callerSocketId: 's-phone', kidId: 'k1' }),
    ).toThrow('no_tablet');
  });

  it('ends a call and forgets it', () => {
    svc.registerSocket('u1', 'tablet', 's-tab');
    svc.registerSocket('u1', 'phone', 's-phone');
    const call = svc.startCall({ userId: 'u1', callerSocketId: 's-phone', kidId: 'k1' });

    svc.endCall(call.id);
    expect(svc.callById(call.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect compile failure**

```bash
npm test -w @mashov/api -- --testPathPattern=calls.service
```

- [ ] **Step 3: Implement**

Create `apps/api/src/modules/calls/calls.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { DeviceRole } from '@mashov/shared';

export interface Call {
  id: string;
  userId: string;
  kidId: string;
  callerSocketId: string;
  calleeSocketId: string;
  startedAt: number;
}

interface SocketEntry {
  userId: string;
  role: DeviceRole;
}

@Injectable()
export class CallsService {
  // socketId → entry
  private readonly sockets = new Map<string, SocketEntry>();
  // userId → { tablet?: socketId, phones: Set<socketId> }
  private readonly byUser = new Map<string, { tablet?: string; phones: Set<string> }>();
  // callId → Call
  private readonly calls = new Map<string, Call>();

  registerSocket(userId: string, role: DeviceRole, socketId: string): void {
    this.sockets.set(socketId, { userId, role });
    let bucket = this.byUser.get(userId);
    if (!bucket) {
      bucket = { phones: new Set() };
      this.byUser.set(userId, bucket);
    }
    if (role === 'tablet') bucket.tablet = socketId;
    else bucket.phones.add(socketId);
  }

  unregisterSocket(socketId: string): void {
    const entry = this.sockets.get(socketId);
    if (!entry) return;
    this.sockets.delete(socketId);
    const bucket = this.byUser.get(entry.userId);
    if (!bucket) return;
    if (entry.role === 'tablet' && bucket.tablet === socketId) bucket.tablet = undefined;
    if (entry.role === 'phone') bucket.phones.delete(socketId);
  }

  socketEntry(socketId: string): SocketEntry | null {
    return this.sockets.get(socketId) ?? null;
  }

  tabletSocketFor(userId: string): string | null {
    return this.byUser.get(userId)?.tablet ?? null;
  }

  phoneSocketsFor(userId: string): string[] {
    return Array.from(this.byUser.get(userId)?.phones ?? []);
  }

  startCall(args: { userId: string; callerSocketId: string; kidId: string }): Call {
    const tablet = this.tabletSocketFor(args.userId);
    if (!tablet) throw new Error('no_tablet');
    const call: Call = {
      id: `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`,
      userId: args.userId,
      kidId: args.kidId,
      callerSocketId: args.callerSocketId,
      calleeSocketId: tablet,
      startedAt: Date.now(),
    };
    this.calls.set(call.id, call);
    return call;
  }

  callById(callId: string): Call | null {
    return this.calls.get(callId) ?? null;
  }

  endCall(callId: string): void {
    this.calls.delete(callId);
  }

  /** Returns all callIds the given socket participates in. Used on disconnect. */
  callsForSocket(socketId: string): string[] {
    const ids: string[] = [];
    for (const c of this.calls.values()) {
      if (c.callerSocketId === socketId || c.calleeSocketId === socketId) ids.push(c.id);
    }
    return ids;
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -w @mashov/api -- --testPathPattern=calls.service
```

Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/calls/calls.service.ts apps/api/test/calls.service.spec.ts
git commit -m "feat(calls): in-memory device + call registry"
```

---

## Task 4: CallsGateway — connection lifecycle + call events

**Files:**
- Create: `apps/api/src/modules/calls/calls.gateway.ts`
- Create: `apps/api/src/modules/calls/calls.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/calls.gateway.e2e-spec.ts`

End-to-end test: boot a Nest app, two real `socket.io-client` instances connect with valid cookies, one identifies as `tablet`, the other as `phone`, the phone initiates and the tablet receives `call:incoming`.

- [ ] **Step 1: Write the failing e2e test**

Create `apps/api/test/calls.gateway.e2e-spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { CALL_EVENTS } from '@mashov/shared';

describe('CallsGateway (e2e)', () => {
  let app: INestApplication;
  let url: string;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    const addr = app.getHttpServer().address();
    url = `http://localhost:${addr.port}`;
    const jwt = app.get(JwtService);
    cookie = `mashov_session=${jwt.sign({ sub: 'family-1' })}`;
  });

  afterAll(async () => { await app.close(); });

  function connect(role: 'tablet' | 'phone'): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const s = ioc(url, {
        path: '/api/calls/socket.io',
        transports: ['websocket'],
        extraHeaders: { cookie },
        query: { role },
      });
      s.on('connect', () => resolve(s));
      s.on('connect_error', reject);
    });
  }

  it('rings the tablet when the phone initiates', async () => {
    const tablet = await connect('tablet');
    const phone = await connect('phone');

    const incoming = new Promise<any>((resolve) =>
      tablet.once(CALL_EVENTS.incoming, resolve),
    );
    const outgoing = new Promise<any>((resolve) =>
      phone.once(CALL_EVENTS.outgoing, resolve),
    );

    phone.emit(CALL_EVENTS.initiate, { kidId: '507f1f77bcf86cd799439011' });

    const [inc, out] = await Promise.all([incoming, outgoing]);
    expect(inc.callId).toEqual(out.callId);
    expect(inc.kidId).toBe('507f1f77bcf86cd799439011');

    tablet.close();
    phone.close();
  });

  it('routes accept/decline back to the caller', async () => {
    const tablet = await connect('tablet');
    const phone = await connect('phone');

    const ringing = new Promise<{ callId: string }>((resolve) =>
      tablet.once(CALL_EVENTS.incoming, resolve),
    );
    phone.emit(CALL_EVENTS.initiate, { kidId: '507f1f77bcf86cd799439011' });
    const { callId } = await ringing;

    const accepted = new Promise<any>((resolve) =>
      phone.once(CALL_EVENTS.accepted, resolve),
    );
    tablet.emit(CALL_EVENTS.accept, { callId });
    expect((await accepted).callId).toBe(callId);

    tablet.close();
    phone.close();
  });

  it('rejects calls when no tablet is online', async () => {
    const phone = await connect('phone');

    const ended = new Promise<any>((resolve) =>
      phone.once(CALL_EVENTS.ended, resolve),
    );
    phone.emit(CALL_EVENTS.initiate, { kidId: '507f1f77bcf86cd799439011' });
    expect((await ended).reason).toBe('no_tablet');

    phone.close();
  });
});
```

- [ ] **Step 2: Run — expect failure (gateway doesn't exist)**

```bash
npm test -w @mashov/api -- --testPathPattern=calls.gateway
```

- [ ] **Step 3: Implement the gateway**

Create `apps/api/src/modules/calls/calls.gateway.ts`:

```ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import {
  CALL_EVENTS,
  DeviceRoleSchema,
  InitiateCallSchema,
  CallIdPayloadSchema,
  SignalSchema,
} from '@mashov/shared';
import { CallsService } from './calls.service';
import { authenticateHandshake } from './ws-auth';

@WebSocketGateway({
  // Live under /api/* so the existing Next.js rewrite proxies us in dev and the
  // single-Railway-service deploy works in prod with the existing JWT cookie.
  path: '/api/calls/socket.io',
  cors: { origin: true, credentials: true },
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly svc: CallsService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(socket: Socket): void {
    const user = authenticateHandshake(socket.handshake.headers.cookie, this.jwt);
    if (!user) {
      socket.emit('error', 'unauthorized');
      socket.disconnect(true);
      return;
    }
    const roleParse = DeviceRoleSchema.safeParse(socket.handshake.query.role);
    if (!roleParse.success) {
      socket.emit('error', 'bad_role');
      socket.disconnect(true);
      return;
    }
    this.svc.registerSocket(user.sub, roleParse.data, socket.id);
    // Stash for cheap access on disconnect.
    (socket.data as Record<string, unknown>).userId = user.sub;
  }

  handleDisconnect(socket: Socket): void {
    // End any calls this socket is in — notify the other side.
    for (const callId of this.svc.callsForSocket(socket.id)) {
      const call = this.svc.callById(callId);
      if (!call) continue;
      const peer = call.callerSocketId === socket.id ? call.calleeSocketId : call.callerSocketId;
      const reason = call.callerSocketId === socket.id ? 'caller_left' : 'callee_left';
      this.server.to(peer).emit(CALL_EVENTS.ended, { callId, reason });
      this.svc.endCall(callId);
    }
    this.svc.unregisterSocket(socket.id);
  }

  @SubscribeMessage(CALL_EVENTS.initiate)
  onInitiate(@MessageBody() body: unknown, @ConnectedSocket() socket: Socket): void {
    const parse = InitiateCallSchema.safeParse(body);
    if (!parse.success) return;
    const entry = this.svc.socketEntry(socket.id);
    if (!entry || entry.role !== 'phone') return;
    try {
      const call = this.svc.startCall({
        userId: entry.userId,
        callerSocketId: socket.id,
        kidId: parse.data.kidId,
      });
      this.server.to(call.calleeSocketId).emit(CALL_EVENTS.incoming, {
        callId: call.id,
        kidId: call.kidId,
        callerName: 'הורה',
      });
      socket.emit(CALL_EVENTS.outgoing, { callId: call.id });
    } catch (err) {
      const reason = (err as Error).message === 'no_tablet' ? 'no_tablet' : 'error';
      socket.emit(CALL_EVENTS.ended, { callId: '', reason });
    }
  }

  @SubscribeMessage(CALL_EVENTS.accept)
  onAccept(@MessageBody() body: unknown, @ConnectedSocket() socket: Socket): void {
    const parse = CallIdPayloadSchema.safeParse(body);
    if (!parse.success) return;
    const call = this.svc.callById(parse.data.callId);
    if (!call || call.calleeSocketId !== socket.id) return;
    this.server.to(call.callerSocketId).emit(CALL_EVENTS.accepted, { callId: call.id });
  }

  @SubscribeMessage(CALL_EVENTS.decline)
  onDecline(@MessageBody() body: unknown, @ConnectedSocket() socket: Socket): void {
    const parse = CallIdPayloadSchema.safeParse(body);
    if (!parse.success) return;
    const call = this.svc.callById(parse.data.callId);
    if (!call || call.calleeSocketId !== socket.id) return;
    this.server.to(call.callerSocketId).emit(CALL_EVENTS.declined, { callId: call.id });
    this.server.to(call.calleeSocketId).emit(CALL_EVENTS.ended, { callId: call.id, reason: 'declined' });
    this.svc.endCall(call.id);
  }

  @SubscribeMessage(CALL_EVENTS.hangup)
  onHangup(@MessageBody() body: unknown, @ConnectedSocket() socket: Socket): void {
    const parse = CallIdPayloadSchema.safeParse(body);
    if (!parse.success) return;
    const call = this.svc.callById(parse.data.callId);
    if (!call) return;
    if (call.callerSocketId !== socket.id && call.calleeSocketId !== socket.id) return;
    const peer = call.callerSocketId === socket.id ? call.calleeSocketId : call.callerSocketId;
    this.server.to(peer).emit(CALL_EVENTS.ended, { callId: call.id, reason: 'hangup' });
    socket.emit(CALL_EVENTS.ended, { callId: call.id, reason: 'hangup' });
    this.svc.endCall(call.id);
  }

  @SubscribeMessage(CALL_EVENTS.signal)
  onSignal(@MessageBody() body: unknown, @ConnectedSocket() socket: Socket): void {
    const parse = SignalSchema.safeParse(body);
    if (!parse.success) return;
    const call = this.svc.callById(parse.data.callId);
    if (!call) return;
    if (call.callerSocketId !== socket.id && call.calleeSocketId !== socket.id) return;
    const peer = call.callerSocketId === socket.id ? call.calleeSocketId : call.callerSocketId;
    this.server.to(peer).emit(CALL_EVENTS.signal, parse.data);
  }
}
```

- [ ] **Step 4: Wire the module**

Create `apps/api/src/modules/calls/calls.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CallsGateway } from './calls.gateway';
import { CallsService } from './calls.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // provides JwtService
  providers: [CallsGateway, CallsService],
})
export class CallsModule {}
```

Modify `apps/api/src/app.module.ts` — add `CallsModule` to the `imports` array (alongside `DashboardModule`).

- [ ] **Step 5: Enable the Socket.io adapter on app boot**

Modify `apps/api/src/main.ts` — after `app = await NestFactory.create(...)` and before `app.listen(...)` add:

```ts
import { IoAdapter } from '@nestjs/platform-socket.io';
// ...
app.useWebSocketAdapter(new IoAdapter(app));
```

If `main.ts` already wires other things, slot this above the `cookieParser()` call.

- [ ] **Step 6: Run the e2e test**

```bash
npm test -w @mashov/api -- --testPathPattern=calls.gateway
```

Expected: all 3 pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/calls/ apps/api/src/app.module.ts apps/api/src/main.ts apps/api/test/calls.gateway.e2e-spec.ts
git commit -m "feat(calls): socket.io signaling gateway with call lifecycle"
```

---

## Task 5: Frontend call client (Socket.io + RTCPeerConnection)

**Files:**
- Create: `apps/web/src/lib/calls/call-client.ts`

Single class managing one Socket.io connection and one (or zero) `RTCPeerConnection`. Emits typed events the React layer subscribes to. No JSX here.

- [ ] **Step 1: Create the client**

Create `apps/web/src/lib/calls/call-client.ts`:

```ts
'use client';

import { io, type Socket } from 'socket.io-client';
import { CALL_EVENTS, type DeviceRole, type SignalPayload } from '@mashov/shared';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export type CallState =
  | { phase: 'idle' }
  | { phase: 'outgoing-ringing'; callId: string; kidId: string }
  | { phase: 'incoming-ringing'; callId: string; kidId: string; callerName: string }
  | { phase: 'connecting'; callId: string }
  | { phase: 'in-call'; callId: string; localStream: MediaStream; remoteStream: MediaStream }
  | { phase: 'ended'; reason: string };

type Listener = (state: CallState) => void;

export class CallClient {
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private state: CallState = { phase: 'idle' };
  private listeners = new Set<Listener>();

  constructor(private readonly role: DeviceRole) {}

  connect(baseUrl: string): void {
    if (this.socket) return;
    this.socket = io(baseUrl, {
      // Matches the gateway's @WebSocketGateway({ path: ... }) value. Lives under
      // /api/* so the Next.js rewrite proxies it transparently in dev and prod.
      path: '/api/calls/socket.io',
      transports: ['websocket'],
      withCredentials: true,
      query: { role: this.role },
    });

    this.socket.on(CALL_EVENTS.incoming, (p: { callId: string; kidId: string; callerName: string }) => {
      this.setState({ phase: 'incoming-ringing', ...p });
    });
    this.socket.on(CALL_EVENTS.outgoing, (p: { callId: string }) => {
      // Already in outgoing-ringing — confirm callId.
      const s = this.state;
      if (s.phase === 'outgoing-ringing') this.setState({ ...s, callId: p.callId });
    });
    this.socket.on(CALL_EVENTS.accepted, async () => {
      // We are the caller — create offer.
      const s = this.state;
      if (s.phase !== 'outgoing-ringing') return;
      await this.startPeer(s.callId, /*isCaller*/ true);
    });
    this.socket.on(CALL_EVENTS.declined, () => {
      this.cleanup();
      this.setState({ phase: 'ended', reason: 'declined' });
    });
    this.socket.on(CALL_EVENTS.ended, ({ reason }: { reason: string }) => {
      this.cleanup();
      this.setState({ phase: 'ended', reason });
    });
    this.socket.on(CALL_EVENTS.signal, (p: SignalPayload) => this.handleSignal(p));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  initiate(kidId: string): void {
    if (!this.socket || this.state.phase !== 'idle') return;
    this.setState({ phase: 'outgoing-ringing', callId: '', kidId });
    this.socket.emit(CALL_EVENTS.initiate, { kidId });
  }

  async accept(): Promise<void> {
    if (this.state.phase !== 'incoming-ringing' || !this.socket) return;
    const { callId } = this.state;
    this.socket.emit(CALL_EVENTS.accept, { callId });
    await this.startPeer(callId, /*isCaller*/ false);
  }

  decline(): void {
    if (this.state.phase !== 'incoming-ringing' || !this.socket) return;
    this.socket.emit(CALL_EVENTS.decline, { callId: this.state.callId });
    this.setState({ phase: 'ended', reason: 'declined' });
  }

  hangup(): void {
    const s = this.state;
    const callId =
      s.phase === 'outgoing-ringing' || s.phase === 'incoming-ringing' ||
      s.phase === 'connecting' || s.phase === 'in-call'
        ? s.callId
        : null;
    if (callId && this.socket) this.socket.emit(CALL_EVENTS.hangup, { callId });
    this.cleanup();
    this.setState({ phase: 'ended', reason: 'hangup' });
  }

  reset(): void {
    this.setState({ phase: 'idle' });
  }

  private async startPeer(callId: string, isCaller: boolean): Promise<void> {
    this.setState({ phase: 'connecting', callId });
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.remoteStream = new MediaStream();
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }
    this.pc.ontrack = (ev) => {
      for (const t of ev.streams[0].getTracks()) this.remoteStream!.addTrack(t);
      this.flushInCall(callId);
    };
    this.pc.onicecandidate = (ev) => {
      if (ev.candidate && this.socket) {
        this.socket.emit(CALL_EVENTS.signal, {
          callId, kind: 'ice', data: ev.candidate.toJSON(),
        });
      }
    };

    if (isCaller) {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.socket?.emit(CALL_EVENTS.signal, { callId, kind: 'offer', data: offer });
    }
  }

  private async handleSignal(p: SignalPayload): Promise<void> {
    // Callee may receive an offer before startPeer has run (we run startPeer on accept,
    // so the offer arrives next). Caller may receive answer; both receive ICE.
    if (p.kind === 'offer') {
      if (!this.pc) await this.startPeer(p.callId, /*isCaller*/ false);
      await this.pc!.setRemoteDescription(p.data as RTCSessionDescriptionInit);
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      this.socket?.emit(CALL_EVENTS.signal, { callId: p.callId, kind: 'answer', data: answer });
    } else if (p.kind === 'answer') {
      await this.pc?.setRemoteDescription(p.data as RTCSessionDescriptionInit);
    } else if (p.kind === 'ice') {
      try { await this.pc?.addIceCandidate(p.data as RTCIceCandidateInit); } catch { /* ignore */ }
    }
  }

  private flushInCall(callId: string): void {
    if (!this.localStream || !this.remoteStream) return;
    this.setState({ phase: 'in-call', callId, localStream: this.localStream, remoteStream: this.remoteStream });
  }

  private cleanup(): void {
    this.pc?.close();
    this.pc = null;
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.remoteStream = null;
  }

  private setState(s: CallState): void {
    this.state = s;
    for (const fn of this.listeners) fn(s);
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npm run -w @mashov/web typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/calls/call-client.ts
git commit -m "feat(calls): WebRTC + socket.io client wrapper"
```

---

## Task 6: React context + provider

**Files:**
- Create: `apps/web/src/lib/calls/call-context.tsx`

- [ ] **Step 1: Create the context**

```tsx
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
    c.connect(window.location.origin);
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
```

- [ ] **Step 2: Decide role per device**

The wall tablet uses `?device=tablet` in its URL (Fully Kiosk start URL); everything else defaults to `phone`.

Modify `apps/web/src/app/(dash)/layout.tsx`:

```tsx
import { ReactNode } from 'react';
import { KidProvider } from '@/lib/kid-context';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { CallProvider } from '@/lib/calls/call-context';
import { IncomingCallOverlay } from '@/components/call/IncomingCallOverlay';
import { CallView } from '@/components/call/CallView';
import { headers } from 'next/headers';

export default function DashLayout({ children }: { children: ReactNode }) {
  // Read ?device= from the request URL; default to 'phone'.
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
```

Note: `referer` is a coarse signal. A cleaner alternative is to set a cookie on first visit with `?device=tablet`. Keep this simple for now; refine later if needed.

- [ ] **Step 3: Type-check**

```bash
npm run -w @mashov/web typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/calls/call-context.tsx apps/web/src/app/\(dash\)/layout.tsx
git commit -m "feat(calls): React provider + device-role detection"
```

---

## Task 7: Incoming call overlay

**Files:**
- Create: `apps/web/src/components/call/IncomingCallOverlay.tsx`

- [ ] **Step 1: Component**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useCall } from '@/lib/calls/call-context';

export function IncomingCallOverlay() {
  const { state, accept, decline } = useCall();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (state.phase === 'incoming-ringing') audioRef.current?.play().catch(() => undefined);
    else audioRef.current?.pause();
  }, [state.phase]);

  if (state.phase !== 'incoming-ringing') return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: 'rgba(20, 22, 28, 0.92)' }}
    >
      <audio ref={audioRef} loop preload="auto" src="/ring.mp3" />
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
```

- [ ] **Step 2: Add a tiny ringtone**

Drop any short looping MP3 at `apps/web/public/ring.mp3` (any royalty-free notification sound — 1-2 seconds, loops cleanly). If you don't have one yet, leave the file absent; the `audio` element silently no-ops and the visual ring still works.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/call/IncomingCallOverlay.tsx
git commit -m "feat(calls): incoming-call overlay UI"
```

---

## Task 8: In-call view

**Files:**
- Create: `apps/web/src/components/call/CallView.tsx`

- [ ] **Step 1: Component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/call/CallView.tsx
git commit -m "feat(calls): in-call view with media controls"
```

---

## Task 9: Call button + end-to-end manual test

**Files:**
- Create: `apps/web/src/components/call/CallButton.tsx`
- Modify: `apps/web/src/app/(dash)/today/page.tsx`

- [ ] **Step 1: Button**

```tsx
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
```

- [ ] **Step 2: Wire into the Today page kid tiles**

In `apps/web/src/app/(dash)/today/page.tsx`, inside the per-kid tile JSX (the `<div className="kid-tile" ...>` block), add the button:

```tsx
<CallButton kidId={k._id} kidName={k.name} kidColor={k.color} />
```

Also add the import at the top: `import { CallButton } from '@/components/call/CallButton';`

- [ ] **Step 3: Local end-to-end test**

```bash
npm run dev
```

Open two browser windows (use a different browser profile or incognito so cookies don't clash):

1. Window A → `http://localhost:3000/today?device=tablet` → log in. This is the wall tablet.
2. Window B → `http://localhost:3000/today` (any other browser/profile) → log in. This is the parent.
3. In Window B click "התקשר" on a kid tile.
4. Window A should show the full-screen incoming call overlay.
5. Click ✓ — both windows transition to the call view; you should see your camera in the corner of both, and the other tab's camera filling the screen.

Expected: video flows both ways. Console errors only acceptable: a one-time `getUserMedia` permission prompt.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/call/CallButton.tsx apps/web/src/app/\(dash\)/today/page.tsx
git commit -m "feat(calls): call button on kid tiles + verified end-to-end"
```

---

## Open questions / explicit non-goals

1. **TURN deferred.** The plan ships with STUN-only. If real calls fail (parent on cellular + restrictive NAT), provision a coturn on Oracle Cloud Always-Free and pass its credentials via `ICE_SERVERS` in `call-client.ts`. Roughly one more day of work.
2. **No call history persistence.** Each call lives only in the in-memory `CallsService` map. Add a Mongoose `CallLog` schema if you later want a "recent calls" view.
3. **No push wake.** If the wall tablet's screen is off / dashboard tab backgrounded, an incoming call won't ring. Mitigations live outside this plan: configure Fully Kiosk Browser on the tablet to keep the app foregrounded with screen-on.
4. **Camera/mic permission.** Vanilla Chrome re-prompts each session; in Fully Kiosk grant permissions persistently via its settings.
5. **One tablet per family.** The service tracks a single tablet socket per user; if two tablets connect, the second overwrites the first. Fine for now; if you ever want multi-room, change `tablet?: string` to `tablets: Set<string>` and fan out the ring.
6. **Self-review note:** ringtone file (`public/ring.mp3`) is optional — visual ring works without it.
