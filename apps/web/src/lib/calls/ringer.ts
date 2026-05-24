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
  const Ctx: typeof AudioContext | undefined =
    (window as Window & { webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
      this.timer = setInterval(() => this.playRingPair(ctx), 2500);
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
    // Classic phone ring: two ~0.4s warbled tones, 100ms gap.
    this.beep(ctx, now, 0.4);
    this.beep(ctx, now + 0.5, 0.4);
  }

  private beep(ctx: AudioContext, at: number, dur: number): void {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
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
    } catch {
      /* ignore — ctx may have closed */
    }
  }
}
