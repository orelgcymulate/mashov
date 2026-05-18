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
