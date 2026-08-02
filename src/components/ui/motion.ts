"use client";

/**
 * Scroll motion for the shared UI layer.
 *
 * This is the second half of the pattern established by the hero's engine in
 * `components/hero/useHeroMotion.ts`, not a rival to it. That one owns a
 * scene: a free-running clock for things that move on their own (bubbles,
 * mist, orbiting bottles), scoped to one component. This one owns the
 * document: things whose position is a pure function of scroll offset, in
 * components that appear on every page.
 *
 * Because scroll-linked motion is a function of scroll and nothing else,
 * there is no free-running loop here at all — a frame is requested when the
 * page scrolls or resizes and never otherwise. Idle costs zero.
 *
 * The rules it keeps, which are the same rules the hero keeps:
 *   - ONE rAF, one scroll listener, one IntersectionObserver for the whole
 *     document, however many subscribers there are.
 *   - Never any React state per frame. Subscribers write transforms straight
 *     to their own node.
 *   - Off-screen subscribers are skipped; a hidden tab does no work.
 *   - `prefers-reduced-motion` means the engine never starts.
 *   - Reads are batched ahead of writes, so N subscribers cost one layout
 *     pass rather than N forced reflows.
 */

import { useEffect, useRef, useState, type RefObject } from "react";

/* ------------------------------------------------------------------ *
 * Device tier
 * ------------------------------------------------------------------ */

export interface MotionEnv {
  /** True once the client has measured itself. SSR renders the still page. */
  ready: boolean;
  /** User asked for no animation. Honour it completely. */
  reduced: boolean;
  /** Phone-sized viewport. */
  compact: boolean;
  /** Weak CPU or small screen — skip anything continuous. */
  lowPower: boolean;
  /** Whether scroll-linked motion is affordable and wanted. */
  parallaxEnabled: boolean;
}

const STILL: MotionEnv = {
  ready: false,
  reduced: false,
  compact: false,
  lowPower: false,
  parallaxEnabled: false,
};

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function measure(): MotionEnv {
  const reduced = prefersReducedMotion();
  const w = window.innerWidth;
  const compact = w < 768;

  /* Same blunt instrument the hero uses, for the same reason: it is the only
     signal that is cheap and universally available, and 4 or fewer logical
     cores on a phone viewport is the profile that drops frames. */
  const cores =
    typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 8;
  const lowPower = cores <= 4 || w < 640;

  return {
    ready: true,
    reduced,
    compact,
    lowPower,
    parallaxEnabled: !reduced && !lowPower,
  };
}

/** Resolves the device tier on mount and follows the reduced-motion switch. */
export function useMotionEnv(): MotionEnv {
  const [env, setEnv] = useState<MotionEnv>(STILL);

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
 * The document scroll engine — one instance, lazily created
 * ------------------------------------------------------------------ */

/**
 * @param progress  0 when the element's top edge first enters from below,
 *                  1 when its bottom edge has left the top. 0.5 is centred.
 * @param rect      the element's current box, already measured for you.
 */
export type ScrollFn = (progress: number, rect: DOMRect) => void;

interface Entry {
  fn: ScrollFn;
  visible: boolean;
  rect: DOMRect | null;
}

let entries: Map<Element, Entry> | null = null;
let observer: IntersectionObserver | null = null;
let frame: number | null = null;
let listening = false;

function schedule(): void {
  if (frame !== null || !entries) return;
  frame = requestAnimationFrame(run);
}

function run(): void {
  frame = null;
  if (!entries || document.visibilityState !== "visible") return;

  const vh = window.innerHeight || 1;

  /* Pass one: read every box. Doing all the reads together means the browser
     computes layout once, instead of once per subscriber. */
  for (const [el, entry] of entries) {
    entry.rect = entry.visible ? el.getBoundingClientRect() : null;
  }

  /* Pass two: hand them out. Subscribers only write from here. */
  for (const entry of entries.values()) {
    const r = entry.rect;
    if (!r) continue;
    const span = vh + r.height;
    const progress = span > 0 ? (vh - r.top) / span : 0;
    entry.fn(progress < 0 ? 0 : progress > 1 ? 1 : progress, r);
  }
}

function ensureListening(): void {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule);
}

function teardown(): void {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  document.removeEventListener("visibilitychange", schedule);
  observer?.disconnect();
  observer = null;
  entries = null;
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
}

/**
 * Register an element for scroll-linked updates. Returns an unsubscribe.
 * Safe to call with the engine already running; the listeners and observer
 * are created once for the whole document and torn down when the last
 * subscriber leaves.
 */
export function observeScroll(el: Element, fn: ScrollFn): () => void {
  if (typeof window === "undefined") return () => {};

  if (!entries) entries = new Map();
  if (!observer) {
    observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const entry = entries?.get(record.target);
          if (!entry) continue;
          entry.visible = record.isIntersecting;
        }
        schedule();
      },
      /* A margin either side so an element is already in the right place by
         the time it is on screen, rather than snapping as it crosses. */
      { rootMargin: "15% 0px" },
    );
  }

  entries.set(el, { fn, visible: false, rect: null });
  observer.observe(el);
  ensureListening();
  schedule();

  return () => {
    observer?.unobserve(el);
    entries?.delete(el);
    if (entries && entries.size === 0) teardown();
  };
}

/* ------------------------------------------------------------------ *
 * Hooks
 * ------------------------------------------------------------------ */

/**
 * Restrained vertical parallax. `strength` is the total travel in pixels
 * across the element's whole pass through the viewport — 12 to 24 is the
 * useful range; past about 40 it stops reading as depth and starts reading
 * as a bug.
 *
 * Writes `translate3d` directly to the node. No state, no re-render.
 */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  strength: number,
  enabled: boolean,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || strength === 0) return;

    return observeScroll(el, (p) => {
      /* -0.5..0.5 so the element sits at its authored position when centred
         and the offset is symmetrical either side. */
      const offset = (p - 0.5) * strength;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
  }, [ref, strength, enabled]);
}

/** Frame-rate independent exponential damping — shared with the hero. */
export function damp(
  current: number,
  goal: number,
  smoothing: number,
  dt: number,
): number {
  return goal + (current - goal) * Math.exp(-dt / smoothing);
}

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

/**
 * Specular tracking: writes the pointer's position over any `.spec` element
 * as `--px` / `--py` percentages, which globals.css turns into a highlight
 * that follows the cursor across the foil.
 *
 * One delegated listener for the whole document rather than a React handler
 * per button. Buttons are server-rendered all over this site and hydrating
 * every one of them to chase a highlight would cost far more than the effect
 * is worth. It also means the effect reaches any `.spec` element, including
 * ones rendered by components that know nothing about it.
 *
 * Installed only where a real pointer exists, so touch devices never run it,
 * and rAF-throttled so a fast mouse cannot outpace the compositor.
 */
export function installSpecularTracking(): () => void {
  if (typeof window === "undefined") return () => {};
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return () => {};
  }

  let pending: { el: HTMLElement; x: number; y: number } | null = null;
  let raf: number | null = null;

  const write = () => {
    raf = null;
    if (!pending) return;
    const { el, x, y } = pending;
    pending = null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    el.style.setProperty("--px", `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--py", `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  const onMove = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const el = target.closest<HTMLElement>(".spec");
    if (!el) return;
    pending = { el, x: event.clientX, y: event.clientY };
    if (raf === null) raf = requestAnimationFrame(write);
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    document.removeEventListener("pointermove", onMove);
    if (raf !== null) cancelAnimationFrame(raf);
  };
}
