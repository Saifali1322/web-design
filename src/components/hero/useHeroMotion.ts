"use client";

/**
 * The hero's motion engine.
 *
 * Everything that moves on the homepage — seven bottles, their bubbles, the
 * ice, the fruit, the mist canvas and the label sweep — is driven by ONE
 * requestAnimationFrame loop declared here. Subscribers register a callback
 * and get `(t, dt)` in seconds; they write straight to `style.transform` and
 * `style.opacity` on their own refs. Nothing in the hero calls setState per
 * frame, and nothing touches a layout property.
 *
 * The loop is gated three ways, because most of the traffic arrives from
 * TikTok on a mid-range Android and a hero that keeps painting off-screen is
 * just a battery drain:
 *   1. `prefers-reduced-motion` — never starts at all.
 *   2. `visibilitychange`      — stops dead when the tab is hidden.
 *   3. IntersectionObserver    — stops when the hero scrolls away.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

/* ------------------------------------------------------------------ *
 * Device tier
 * ------------------------------------------------------------------ */

export interface HeroEnv {
  /** True once the client has measured itself. SSR renders the still scene. */
  ready: boolean;
  /** User asked for no animation. Honour it completely. */
  reduced: boolean;
  /** Phone-sized viewport. Drives layout as well as budget. */
  compact: boolean;
  /** Weak CPU or small screen — cut everything expensive. */
  lowPower: boolean;
  /** Whether blur filters are affordable. Blur is the single biggest cost. */
  blurEnabled: boolean;
  /** How many motes the canvas may draw. */
  particleCount: number;
  /** How many bubbles each bottle gets. */
  bubbleCount: number;
}

const STILL: HeroEnv = {
  ready: false,
  reduced: false,
  compact: false,
  lowPower: false,
  blurEnabled: true,
  particleCount: 34,
  bubbleCount: 7,
};

function measure(): HeroEnv {
  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const w = window.innerWidth;
  const compact = w < 768;

  /* hardwareConcurrency is a blunt instrument but it is the only signal that
     is universally available and cheap. 4 or fewer logical cores on a phone
     viewport is the profile that drops frames. */
  const cores =
    typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 8;
  const weakCpu = cores <= 4;
  const lowPower = weakCpu || w < 640;

  return {
    ready: true,
    reduced,
    compact,
    lowPower,
    /* Blur on a moving element forces a re-rasterise every frame. Keep it for
       desktop, where it sells the depth of field, and drop it below. */
    blurEnabled: !lowPower && !reduced,
    particleCount: reduced ? 0 : lowPower ? 12 : compact ? 20 : 38,
    bubbleCount: reduced ? 0 : lowPower ? 3 : compact ? 4 : 7,
  };
}

/** Resolves the device tier on mount and follows the reduced-motion switch. */
export function useHeroEnv(): HeroEnv {
  const [env, setEnv] = useState<HeroEnv>(STILL);

  useEffect(() => {
    const apply = () => setEnv(measure());
    apply();

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", apply);
    wide.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      wide.removeEventListener("change", apply);
    };
  }, []);

  return env;
}

/* ------------------------------------------------------------------ *
 * The loop
 * ------------------------------------------------------------------ */

export type FrameFn = (t: number, dt: number) => void;

export interface MotionClock {
  /** Register a per-frame callback. Returns an unsubscribe function. */
  subscribe: (fn: FrameFn) => () => void;
  /** Force a single frame — used to compose the still scene. */
  tick: () => void;
}

/**
 * One loop, many subscribers.
 *
 * @param rootRef  element observed for on-screen-ness
 * @param active   false disables the loop entirely (reduced motion)
 */
export function useMotionClock(
  rootRef: RefObject<HTMLElement | null>,
  active: boolean,
): MotionClock {
  const subs = useRef<Set<FrameFn>>(new Set());
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const elapsed = useRef(0);
  const visible = useRef(true);
  const onScreen = useRef(true);

  /** Runs every subscriber once at the current clock position. */
  const emit = useCallback((dt: number) => {
    const t = elapsed.current;
    for (const fn of subs.current) fn(t, dt);
  }, []);

  const tick = useCallback(() => emit(0), [emit]);

  useEffect(() => {
    if (!active) return;

    const el = rootRef.current;

    const frame = (now: number) => {
      /* Clamp dt. A backgrounded tab that misses the visibility event, or a
         long GC pause, would otherwise teleport every bottle across its
         orbit on the next frame. */
      const dt = Math.min((now - last.current) / 1000, 1 / 20);
      last.current = now;
      elapsed.current += dt;
      emit(dt);
      raf.current = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf.current !== null) return;
      if (!visible.current || !onScreen.current) return;
      last.current = performance.now();
      raf.current = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (raf.current === null) return;
      cancelAnimationFrame(raf.current);
      raf.current = null;
    };

    const onVisibility = () => {
      visible.current = document.visibilityState === "visible";
      if (visible.current) start();
      else stop();
    };

    document.addEventListener("visibilitychange", onVisibility);

    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          onScreen.current = entries[0]?.isIntersecting ?? true;
          if (onScreen.current) start();
          else stop();
        },
        { rootMargin: "120px" },
      );
      io.observe(el);
    }

    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
    };
  }, [active, emit, rootRef]);

  const subscribe = useCallback((fn: FrameFn) => {
    subs.current.add(fn);
    return () => {
      subs.current.delete(fn);
    };
  }, []);

  return { subscribe, tick };
}

/* ------------------------------------------------------------------ *
 * Pointer parallax
 * ------------------------------------------------------------------ */

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Damped pointer position in the range -1..1, relative to the element centre.
 *
 * Returns a mutable ref rather than state: the frame loop reads `.current`
 * and the pointer handler writes the target, so moving the mouse never
 * re-renders React. `ease` is applied per frame by {@link dampTowards}.
 */
export function usePointerParallax(
  rootRef: RefObject<HTMLElement | null>,
  active: boolean,
): { pointer: RefObject<Vec2>; target: RefObject<Vec2> } {
  const pointer = useRef<Vec2>({ x: 0, y: 0 });
  const target = useRef<Vec2>({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) return;
    const el = rootRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      /* getBoundingClientRect on pointermove is a read, not a write, and the
         pointer only moves a few dozen times a second — cheap enough, and it
         stays correct through scroll and resize without extra listeners. */
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      target.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };

    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [active, rootRef]);

  return { pointer, target };
}

/**
 * Frame-rate independent exponential damping.
 * `smoothing` is the fraction of the remaining distance left after 1 second.
 */
export function damp(
  current: number,
  goal: number,
  smoothing: number,
  dt: number,
): number {
  return goal + (current - goal) * Math.exp(-dt / smoothing);
}

export function dampTowards(
  v: Vec2,
  goal: Vec2,
  smoothing: number,
  dt: number,
): void {
  v.x = damp(v.x, goal.x, smoothing, dt);
  v.y = damp(v.y, goal.y, smoothing, dt);
}

/* ------------------------------------------------------------------ *
 * Small maths helpers shared by the hero pieces
 * ------------------------------------------------------------------ */

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Deterministic pseudo-random in 0..1. Same droplets on server and client. */
export function hashRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Cheap ease used by the flavour transition. */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
