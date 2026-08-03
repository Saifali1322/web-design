"use client";

/**
 * A gold ring that follows the pointer.
 *
 * Two decisions worth stating, because both are the opposite of what most
 * custom cursors do.
 *
 * The native cursor stays. Hiding it is the usual move and it is a bad trade:
 * the system cursor is the one part of the interface a person already knows,
 * it changes shape to tell them what a thing is — a caret over text, a resize
 * arrow on a table edge, a wait state — and replacing it with a dot means
 * reimplementing all of that badly. This is a halo around the real cursor,
 * not a substitute for it, so nothing is fighting the browser and nothing has
 * to be reimplemented. It is hidden outright over form fields anyway, where
 * the caret is doing precise work and a ring around it is just noise.
 *
 * It is installed rather than rendered. One element, one pointermove listener
 * and one rAF for the whole document, created imperatively next to the
 * specular tracking in InteractionLayer — the same reasoning as there. A React
 * component would mean a client boundary and a ref on a page that otherwise
 * needs neither, for something that is not state by any definition.
 *
 * Gated on a real pointer, so no touch device ever runs it, and on
 * prefers-reduced-motion, where it is omitted entirely: a ring that tracks the
 * cursor exactly, with the lag taken out, is not a considered detail, it is a
 * second cursor. Both gates are live, so a tablet that gains a mouse gets it
 * and a person who turns motion off loses it without a reload.
 *
 * The loop stops itself. It runs while the ring is catching up and shuts down
 * the moment it has, so a still pointer costs nothing.
 */

import { damp } from "./motion";

/** Diameter in px. Big enough to read as a ring, small enough not to obscure. */
const SIZE = 26;

/** Fraction of the distance left after one second — the whole feel, in one number. */
const SMOOTHING = 0.045;

/** What counts as "you are pointing at something you can use". */
const INTERACTIVE =
  'a[href], button, summary, label, [role="button"], [role="link"], ' +
  '[tabindex]:not([tabindex="-1"]), .card-motion';

/** Where the ring gets out of the way and lets the caret do its job. */
const TEXT_ENTRY =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

type Mode = "rest" | "active" | "hidden";

function start(): () => void {
  const ring = document.createElement("div");
  ring.setAttribute("aria-hidden", "true");
  ring.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${SIZE}px`,
    `height:${SIZE}px`,
    /* Negative margins put the box's centre on the translated origin, so the
       scale below grows about the pointer rather than away from it. */
    `margin:${-SIZE / 2}px 0 0 ${-SIZE / 2}px`,
    "border:1px solid rgba(212,166,60,0.85)",
    "border-radius:50%",
    /* A hairline of gold disappears over photography, and the menu is mostly
       photography. The halo is what makes it readable there; thickening the
       ring instead would make it a target rather than a trace. */
    "box-shadow:0 0 10px -1px rgba(212,166,60,0.35)",
    "pointer-events:none",
    "z-index:90",
    "opacity:0",
    "translate:0 0 0",
    "scale:1",
    "will-change:translate, scale",
    /* Position and size are separate transform properties, and it has to be
       `translate` rather than `transform` for the position. The frame loop
       writes the position every frame while the hover scale is a CSS
       transition, so they cannot share one property — and CSS composes the
       individual properties as translate → rotate → scale → transform, which
       means a `transform` translation would be multiplied by the `scale` and
       the ring would fly off the right of the screen the moment it grew. */
    "transition:opacity 200ms linear, scale 320ms cubic-bezier(0.22,1,0.36,1), background-color 320ms cubic-bezier(0.22,1,0.36,1), border-color 320ms cubic-bezier(0.22,1,0.36,1)",
  ].join(";");
  document.body.appendChild(ring);

  const target = { x: 0, y: 0 };
  const at = { x: 0, y: 0 };
  let placed = false;
  let raf: number | null = null;
  let last = 0;
  let mode: Mode = "rest";
  let pressed = false;
  let inWindow = false;
  /* pointermove fires ~120 times a second and the answer only changes when
     the pointer crosses into a different element. */
  let lastTarget: Element | null = null;

  const paint = () => {
    ring.style.opacity = inWindow && mode !== "hidden" && placed ? "1" : "0";
    const scale = mode === "active" ? 1.85 : 1;
    ring.style.scale = String(pressed ? scale * 0.84 : scale);
    ring.style.backgroundColor =
      mode === "active" ? "rgba(212,166,60,0.12)" : "transparent";
    ring.style.borderColor =
      mode === "active" ? "rgba(243,218,139,0.95)" : "rgba(212,166,60,0.85)";
  };

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    at.x = damp(at.x, target.x, SMOOTHING, dt);
    at.y = damp(at.y, target.y, SMOOTHING, dt);
    ring.style.translate = `${at.x.toFixed(1)}px ${at.y.toFixed(1)}px 0`;

    // Settled: stop until the pointer moves again. An idle cursor costs zero.
    if (Math.abs(at.x - target.x) < 0.1 && Math.abs(at.y - target.y) < 0.1) {
      raf = null;
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const run = () => {
    if (raf !== null || document.visibilityState !== "visible") return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (raf === null) return;
    cancelAnimationFrame(raf);
    raf = null;
  };

  const onMove = (event: PointerEvent) => {
    target.x = event.clientX;
    target.y = event.clientY;
    inWindow = true;

    if (!placed) {
      // First sighting: land on the pointer rather than flying in from 0,0.
      at.x = target.x;
      at.y = target.y;
      placed = true;
      ring.style.translate = `${at.x}px ${at.y}px 0`;
    }

    const el = event.target instanceof Element ? event.target : null;
    if (el !== lastTarget) {
      lastTarget = el;
      mode = !el
        ? "rest"
        : el.closest(TEXT_ENTRY)
          ? "hidden"
          : el.closest(INTERACTIVE)
            ? "active"
            : "rest";
    }

    paint();
    run();
  };

  const onLeave = (event: PointerEvent) => {
    // relatedTarget is null only when the pointer has actually left the window.
    if (event.relatedTarget !== null) return;
    inWindow = false;
    lastTarget = null;
    paint();
  };

  const onDown = () => {
    pressed = true;
    paint();
  };
  const onUp = () => {
    pressed = false;
    paint();
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") run();
    else stop();
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", onLeave, { passive: true });
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerup", onUp, { passive: true });
  document.addEventListener("pointercancel", onUp, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    stop();
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerout", onLeave);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    document.removeEventListener("visibilitychange", onVisibility);
    ring.remove();
  };
}

/**
 * Installs the ring if this device and this person should have one, and keeps
 * following both answers. Returns a teardown.
 */
export function installCursor(): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  let running: (() => void) | null = null;

  const sync = () => {
    const wanted = fine.matches && !calm.matches;
    if (wanted && !running) running = start();
    else if (!wanted && running) {
      running();
      running = null;
    }
  };

  sync();
  fine.addEventListener("change", sync);
  calm.addEventListener("change", sync);

  return () => {
    fine.removeEventListener("change", sync);
    calm.removeEventListener("change", sync);
    running?.();
    running = null;
  };
}
