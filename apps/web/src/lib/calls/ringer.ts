/**
 * Tiny phone-ring generator using Web Audio — no MP3 file required.
 * Plays a classic 2-tone "ring ring … ring ring" pattern on a loop until
 * stop() is called. Works on every browser that supports AudioContext.
 */
export class Ringer {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.timer) return;
    const Ctx = typeof window !== 'undefined' ? window.AudioContext : undefined;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const ring = (): void => this.playRingPair();
    ring();
    this.timer = setInterval(ring, 2500);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }

  private playRingPair(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Classic phone ring: two ~0.4s tones, 100ms gap.
    this.beep(now, 0.4);
    this.beep(now + 0.5, 0.4);
  }

  private beep(at: number, dur: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    // Two pitched oscillators stacked create a classic ringer warble.
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, at);
    osc.frequency.setValueAtTime(440, at + dur / 2);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.25, at + 0.04);
    gain.gain.setValueAtTime(0.25, at + dur - 0.04);
    gain.gain.linearRampToValueAtTime(0, at + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(at);
    osc.stop(at + dur);
  }
}
