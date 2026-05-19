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
    // Connect straight to the API origin (Next.js's rewrite doesn't reliably
    // proxy WebSocket upgrades). Auth via the JWT stashed by the login form;
    // cookies can't cross *.up.railway.app subdomains.
    const token = typeof window !== 'undefined' ? localStorage.getItem('mashov_token') : null;
    this.socket = io(baseUrl, {
      path: '/api/calls/socket.io',
      transports: ['websocket'],
      query: { role: this.role },
      auth: token ? { token } : undefined,
    });

    this.socket.on(CALL_EVENTS.incoming, (p: { callId: string; kidId: string; callerName: string }) => {
      this.setState({ phase: 'incoming-ringing', ...p });
    });
    this.socket.on(CALL_EVENTS.outgoing, (p: { callId: string }) => {
      const s = this.state;
      if (s.phase === 'outgoing-ringing') this.setState({ ...s, callId: p.callId });
    });
    this.socket.on(CALL_EVENTS.accepted, async () => {
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
