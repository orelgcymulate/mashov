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
    const handshakeAuth = (socket.handshake.auth as { token?: string } | undefined) ?? {};
    const queryToken = typeof socket.handshake.query.token === 'string' ? socket.handshake.query.token : undefined;
    const user = authenticateHandshake(
      {
        cookieHeader: socket.handshake.headers.cookie,
        token: handshakeAuth.token ?? queryToken,
      },
      this.jwt,
    );
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
    (socket.data as Record<string, unknown>).userId = user.sub;
  }

  handleDisconnect(socket: Socket): void {
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
