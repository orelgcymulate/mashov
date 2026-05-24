/**
 * Cross-browser phone-ringer.
 *
 * Strategy:
 *  1. On the FIRST user gesture anywhere on the page, create a shared
 *     AudioContext and "unlock" it via the silent-buffer trick (the only
 *     thing iOS Safari accepts as a true unlock).
 *  2. Ringer.start() then plays a warbled 2-tone ring on a 2.5s loop using
 *     that context. Calls .resume() defensively (it can suspend itself when
 *     the tab is backgrounded).
 *  3. Visual + haptic fallbacks always fire (document.title flash + the
 *     Vibration API on mobile) so the user still notices the call when
 *     audio is blocked by system mute, tab mute, or strict autoplay rules.
 */

let sharedCtx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctx = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  return sharedCtx;
}

/** Must run from inside a user-gesture handler. iOS Safari demands all of
 * this in one synchronous flow: construct (or already-have) context, call
 * resume, and play at least one silent buffer through it. */
function unlockNow(): void {
  const ctx = getCtx();
  if (!ctx) return;
  // resume() returns a promise — fire-and-forget so we stay synchronous.
  ctx.resume().catch(() => undefined);
  if (unlocked) return;
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    unlocked = true;
  } catch {
    /* old browsers — best effort */
  }
}

// Arm a global one-shot listener that unlocks on the first user gesture.
// `capture: true` fires before React handlers; `once` removes it for us.
if (typeof document !== 'undefined') {
  const opts: AddEventListenerOptions = { capture: true, once: true };
  const handler = (): void => unlockNow();
  document.addEventListener('click', handler, opts);
  document.addEventListener('touchstart', handler, opts);
  document.addEventListener('touchend', handler, opts);
  document.addEventListener('keydown', handler, opts);
}

/** Called from CallProvider on mount. Idempotent. */
export function primeAudio(): void {
  // No-op now — getCtx() is lazy and the unlock listener is module-level.
}

/** Public for the settings page "test ringtone" button. */
export function unlockAudioFromGesture(): void {
  unlockNow();
}

export class Ringer {
  private timer: ReturnType<typeof setInterval> | null = null;
  private titleSaved: string | null = null;
  private titleFlasher: ReturnType<typeof setInterval> | null = null;

  /** Synchronous — safe to call directly from a click/touch handler. */
  start(): void {
    if (this.timer) return;

    const ctx = getCtx();
    if (ctx) {
      // Resume in the background. If we're inside a gesture handler this
      // succeeds; if not, it stays suspended and audio silently no-ops —
      // the visual + haptic fallbacks below still fire.
      ctx.resume().catch(() => undefined);
      this.playRingPair(ctx);
      // Full melody is ~1.7s; gap of ~1.3s makes a nice 3s cycle.
      this.timer = setInterval(() => this.playRingPair(ctx), 3000);
    }

    // Visual fallback for muted/backgrounded tabs.
    if (typeof document !== 'undefined') {
      this.titleSaved = document.title;
      let on = true;
      this.titleFlasher = setInterval(() => {
        document.title = on ? '📞 שיחה נכנסת — לחץ לעניית' : (this.titleSaved ?? '');
        on = !on;
      }, 800);
    }

    // Haptic fallback on mobile.
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
    if (this.titleSaved !== null && typeof document !== 'undefined') {
      document.title = this.titleSaved;
      this.titleSaved = null;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(0); } catch { /* ignore */ }
    }
  }

  private playRingPair(ctx: AudioContext): void {
    if (ctx.state !== 'running') return;
    const now = ctx.currentTime;
    // iPhone-style marimba chime: C-E-G-C arpeggio up, G-E-C down.
    // Each note is a sine + 3rd harmonic with exponential decay — sounds like
    // a struck bell rather than a synth bleep.
    const notes: Array<[number, number, number]> = [
      // [startOffset, durationSec, freq]
      [0.00, 0.18, 523.25],   // C5
      [0.18, 0.18, 659.25],   // E5
      [0.36, 0.18, 783.99],   // G5
      [0.54, 0.32, 1046.5],   // C6
      [0.95, 0.18, 783.99],   // G5
      [1.13, 0.18, 659.25],   // E5
      [1.31, 0.36, 523.25],   // C5
    ];
    for (const [offset, dur, freq] of notes) {
      this.note(ctx, now + offset, dur, freq);
    }
  }

  private note(ctx: AudioContext, at: number, dur: number, freq: number): void {
    try {
      // Master gain: quick attack, exponential decay → bell-like.
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, at);
      out.gain.exponentialRampToValueAtTime(0.5, at + 0.01);
      out.gain.exponentialRampToValueAtTime(0.001, at + dur);
      out.connect(ctx.destination);

      // Fundamental (sine).
      const fund = ctx.createOscillator();
      fund.type = 'sine';
      fund.frequency.value = freq;
      fund.connect(out);
      fund.start(at);
      fund.stop(at + dur);

      // Higher harmonic at 1/3 volume — adds the "bell" shimmer.
      const overGain = ctx.createGain();
      overGain.gain.setValueAtTime(0.0001, at);
      overGain.gain.exponentialRampToValueAtTime(0.18, at + 0.005);
      overGain.gain.exponentialRampToValueAtTime(0.001, at + dur * 0.7);
      overGain.connect(out);

      const over = ctx.createOscillator();
      over.type = 'sine';
      over.frequency.value = freq * 3;
      over.connect(overGain);
      over.start(at);
      over.stop(at + dur);
    } catch {
      /* ignore — ctx may have closed */
    }
  }
}
