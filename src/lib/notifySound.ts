/**
 * Cross-browser notification sound + browser-notification helpers.
 *
 * Strategy for reliable playback on all browsers:
 * 1. Lazily create a single shared AudioContext (Safari needs `webkitAudioContext`).
 * 2. Unlock the AudioContext on the FIRST user gesture (Chrome/Safari/Firefox autoplay
 *    policies block audio until the user has interacted with the page at least once).
 * 3. On every play, if the context is `suspended`, call `resume()` and wait for it.
 * 4. If WebAudio fails (older browsers, locked context, sandboxed iframe), fall back to
 *    an HTMLAudioElement playing a tiny inline base64 WAV ding.
 * 5. Respect a user mute preference stored in localStorage.
 */

const STORAGE_MUTE_KEY = "nilex.notifySound.muted";

// --- AudioContext (singleton) ---
type AnyAC = typeof AudioContext;
const ACCtor: AnyAC | undefined =
  typeof window !== "undefined"
    ? (window.AudioContext || (window as unknown as { webkitAudioContext?: AnyAC }).webkitAudioContext)
    : undefined;

let ctx: AudioContext | null = null;
let unlocked = false;
let unlockListenersAttached = false;

const getCtx = (): AudioContext | null => {
  if (!ACCtor) return null;
  if (!ctx) {
    try {
      ctx = new ACCtor();
    } catch {
      ctx = null;
    }
  }
  return ctx;
};

/** Resume a suspended context (autoplay-policy unlock). Safe to call repeatedly. */
const resumeCtx = async (): Promise<boolean> => {
  const c = getCtx();
  if (!c) return false;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      return false;
    }
  }
  return c.state === "running";
};

/** Attach one-time gesture listeners that unlock audio. Idempotent. */
const attachUnlockListeners = () => {
  if (unlockListenersAttached || typeof window === "undefined") return;
  unlockListenersAttached = true;

  const handler = async () => {
    const ok = await resumeCtx();
    // Play a near-silent buffer to fully unlock on iOS Safari
    const c = getCtx();
    if (c) {
      try {
        const buf = c.createBuffer(1, 1, 22050);
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(0);
      } catch {
        /* ignore */
      }
    }
    if (ok) {
      unlocked = true;
      detach();
    }
  };

  const events: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown", "click"];
  const detach = () => events.forEach((e) => window.removeEventListener(e, handler));
  events.forEach((e) => window.addEventListener(e, handler, { once: false, passive: true }));
};

// Attach immediately on module load (browser only)
if (typeof window !== "undefined") {
  attachUnlockListeners();
}

// --- Mute preference ---
export const isNotifySoundMuted = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_MUTE_KEY) === "1";
  } catch {
    return false;
  }
};

export const setNotifySoundMuted = (muted: boolean): void => {
  try {
    localStorage.setItem(STORAGE_MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
};

// --- HTMLAudio fallback (tiny base64 WAV ding) ---
// 22kHz, ~250ms two-tone beep generated offline. Small enough to inline.
const FALLBACK_WAV_BASE64 =
  "UklGRiQEAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAEAAAAAAAA/wfTBhMNQAt3CD8Cdvz5+CD3qPiL+xv/CALWA1MEoAOSAUL+1foM+Pf2lvit+yT/3wJ4BS0GiQRzAOj7L/jN9hr4f/sc/9wCXgWBBV4DJAB2/On5g/g0+EH53/r//Ej/ZAEDA3MEjAVMBoYGTAaJBaED9wAm/jb8e/sm/Pj91ABbBPYHxAr5C0wL9whpBfsBwf+5/00BIAUTCb4LLwzvCdwELP6r9wPzD/HE8oj33f4uBvgLjQ7uDLQHWf9p9rDvze1U8Fz26P3KBKEJ8wpQCBYC5/jX79boM+Wx5sLs+/Wo/0EH4ApbCggGDP878v3l+9rD0xLT5dlS5z/4hQikFUAcdRqcEM8AGu7G2u3MYsXuxSnPV96o8JQAUg06EvANJgK/8KveKcz+vLSyjLAGtSPB99TC7oQHyhmDIHsUrPyA3vrCxa9fp8ymeKzitCu6fbR4ohqJkXi7bd1mfm+0gE2byrm91IzobO6/53Df+t4i6oIBzhoxKx0xfygwBjHXGJxMa1xLCEEYUEttSpRZBlsBPmQI3boLZdEOY8YdkM1zyHXbihbAgQ5UWSiKcoCLPDLmbJrYU+E1HVGdz63RoVL9hdH7XOTqv6Df8MAg2DLmL9wYjOoWtXuOoXuRrqwQ8w==";

let fallbackAudio: HTMLAudioElement | null = null;

const playFallback = (): boolean => {
  try {
    if (!fallbackAudio) {
      fallbackAudio = new Audio("data:audio/wav;base64," + FALLBACK_WAV_BASE64);
      fallbackAudio.preload = "auto";
    }
    // Clone so overlapping sounds don't cut each other off
    const a = fallbackAudio.cloneNode(true) as HTMLAudioElement;
    a.volume = 0.4;
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    return true;
  } catch {
    return false;
  }
};

// --- WebAudio synthesized ding ---
const playWebAudio = (): boolean => {
  const c = getCtx();
  if (!c || c.state !== "running") return false;
  try {
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.connect(g);
    g.connect(c.destination);
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(440, now + 0.18);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    o.start(now);
    o.stop(now + 0.28);
    return true;
  } catch {
    return false;
  }
};

/** Play the notification sound. Safe to call from any context. */
export const playNotifySound = async (): Promise<void> => {
  if (isNotifySoundMuted()) return;

  // Try to resume in case we're inside a user-gesture handler
  await resumeCtx();

  // Prefer WebAudio when running, else fall back to HTMLAudio
  if (unlocked && playWebAudio()) return;
  if (playWebAudio()) return;
  playFallback();
};

/** Manually unlock audio — call from a user-gesture handler if you want a guaranteed unlock. */
export const unlockNotifySound = async (): Promise<boolean> => {
  attachUnlockListeners();
  const ok = await resumeCtx();
  if (ok) unlocked = true;
  return ok;
};

// --- Browser Notifications API ---
export const requestNotifyPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const r = await Notification.requestPermission();
    return r === "granted";
  } catch {
    return false;
  }
};

export interface BrowserNotifyOptions {
  /** Force showing even when the tab is visible (default: false). */
  force?: boolean;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export const showBrowserNotification = (
  title: string,
  body: string,
  opts: BrowserNotifyOptions = {},
): Notification | null => {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;
  if (!opts.force && document.visibilityState === "visible") return null;
  try {
    const n = new Notification(title, {
      body,
      icon: opts.icon || "/favicon.ico",
      tag: opts.tag,
    });
    if (opts.onClick) {
      n.onclick = (e) => {
        e.preventDefault();
        window.focus();
        opts.onClick?.();
        n.close();
      };
    }
    return n;
  } catch {
    return null;
  }
};
