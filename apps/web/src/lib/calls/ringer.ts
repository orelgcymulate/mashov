/**
 * Tiny phone-ring generator using Web Audio — no MP3 file required.
 *
 * Browser autoplay rules: a fresh AudioContext starts suspended and can only
 * be unlocked from a user gesture. To survive incoming calls that arrive
 * after the user has been idle, we keep one shared context per session and
 * unlock it the first time anyone clicks/taps/types on the page. Every Ringer
 * instance reuses that context.
 */
let sharedCtx: AudioContext | null = null;
let unlockBound = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  if (!unlockBound) bindUnlock();
  return sharedCtx;
}

function bindUnlock(): void {
  unlockBound = true;
  const unlock = (): void => {
    sharedCtx?.resume().catch(() => undefined);
    document.removeEventListener('click', unlock, true);
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('keydown', unlock, true);
    unlockBound = false;
  };
  document.addEventListener('click', unlock, true);
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('keydown', unlock, true);
}

/** Call once after page load (e.g. from CallProvider) to start unlocking. */
export function primeAudio(): void {
  ensureCtx();
}

export class Ringer {
  private timer: ReturnType<typeof setInterval> | null = null;
  private titleSaved: string | null = null;
  private titleFlasher: ReturnType<typeof setInterval> | null = null;

  async start(): Promise<void> {
    if (this.timer) return;
    const ctx = ensureCtx();
    if (ctx?.state === 'suspended') {
      try { await ctx.resume(); } catch { /* user-gesture needed */ }
    }
    const ring = (): void => { if (ctx) this.playRingPair(ctx); };
    ring();
    this.timer = setInterval(ring, 2500);

    // Visual fallback for muted browsers / backgrounded tabs.
    this.titleSaved = document.title;
    let on = true;
    this.titleFlasher = setInterval(() => {
      document.title = on ? '📞 שיחה נכנסת — לחץ לעניית' : (this.titleSaved ?? '');
      on = !on;
    }, 800);

    // Phone-style vibration where supported (mobile browsers).
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate([400, 200, 400, 1500]); } catch { /* ignore */ }
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.titleFlasher) {
      clearInterval(this.titleFlasher);
      this.titleFlasher = null;
    }
    if (this.titleSaved !== null) {
      document.title = this.titleSaved;
      this.titleSaved = null;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(0); } catch { /* ignore */ }
    }
    // Keep sharedCtx alive — re-used for the next call.
  }

  private playRingPair(ctx: AudioContext): void {
    const now = ctx.currentTime;
    // Classic phone ring: two ~0.4s warbled tones with a 100ms gap.
    this.beep(ctx, now, 0.4);
    this.beep(ctx, now + 0.5, 0.4);
  }

  private beep(ctx: AudioContext, at: number, dur: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Two-pitch warble for that classic "ring" feel.
    osc.frequency.setValueAtTime(480, at);
    osc.frequency.setValueAtTime(440, at + dur / 2);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.5, at + 0.04);
    gain.gain.setValueAtTime(0.5, at + dur - 0.04);
    gain.gain.linearRampToValueAtTime(0, at + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur);
  }
}
