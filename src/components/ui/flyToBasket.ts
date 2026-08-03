"use client";

/**
 * The bottle that flies into the basket.
 *
 * A one-shot, so it deliberately does NOT join the shared frame loops in
 * `hero/useHeroMotion.ts` or `ui/motion.ts`. Those exist for motion that is
 * continuous or scroll-linked and therefore has to be budgeted; this is a
 * half-second arc that starts on a click, disposes itself, and is idle the
 * rest of the time. Handing it to a subscriber loop would cost more
 * bookkeeping than it saves.
 *
 * It is built out of plain DOM rather than a React portal for the same reason
 * the specular tracking is: nothing about it is state. Three nested nodes are
 * created, three Web Animations are started on them, and the whole thing is
 * removed on completion. React never re-renders because of it, and the flight
 * survives a route change mid-air.
 *
 * The arc comes from splitting the axes across two nodes — the outer one
 * carries X on a decelerating curve, the inner one carries Y on an
 * accelerating one. Animating a single node's translate between two points
 * gives a straight line however it is eased; two nodes give a real curve for
 * the same cost.
 */

import { prefersReducedMotion } from "./motion";

/**
 * Marks the element a flight lands on and the element that pulses when it
 * arrives — the header basket. Queried rather than passed down so that any
 * "add" button anywhere can fly without threading a ref through the tree.
 */
export const BASKET_TARGET_ATTR = "data-basket-target";

/**
 * A mashed button should not be able to put hundreds of nodes on the page.
 * Past this many in the air the extra ones are indistinguishable anyway, so
 * the click still lands and still pulses the basket, it just doesn't fly.
 */
const MAX_IN_FLIGHT = 10;

/** Bottle silhouette: neck, shoulders, body, chamfered base. */
const BOTTLE_CLIP =
  "polygon(38% 0%, 62% 0%, 62% 20%, 100% 38%, 100% 95%, 94% 100%, 6% 100%, 0% 95%, 0% 38%, 38% 20%)";

export interface FlightColours {
  /** The juice's own accent — the flying bottle is the product, not a dot. */
  accent: string;
  accentDeep: string;
}

let layer: HTMLElement | null = null;
let inFlight = 0;

/** Decorative overlay, created once, above the drawer and below the skip link. */
function ensureLayer(): HTMLElement {
  if (layer && layer.isConnected) return layer;
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText =
    "position:fixed;inset:0;z-index:80;pointer-events:none";
  document.body.appendChild(el);
  layer = el;
  return el;
}

function basketTarget(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[${BASKET_TARGET_ATTR}]`);
}

/** Centre of a box, in viewport coordinates. */
function centre(r: DOMRect): { x: number; y: number } {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * A short bounce on the basket. This is the part that survives
 * `prefers-reduced-motion`: without it a click that skips the flight has no
 * acknowledgement at all beyond the count quietly changing. Reduced motion
 * gets the same gesture with the overshoot taken out.
 */
export function pulseBasket(): void {
  const target = basketTarget();
  if (!target || typeof target.animate !== "function") return;

  const calm = prefersReducedMotion();
  target.animate(
    calm
      ? [
          { transform: "scale(1)" },
          { transform: "scale(1.07)", offset: 0.45 },
          { transform: "scale(1)" },
        ]
      : [
          { transform: "scale(1)" },
          { transform: "scale(1.1)", offset: 0.32 },
          { transform: "scale(0.985)", offset: 0.62 },
          { transform: "scale(1)" },
        ],
    {
      duration: calm ? 260 : 460,
      easing: calm ? "ease-out" : "cubic-bezier(0.34, 1.42, 0.64, 1)",
    },
  );
}

/**
 * Sends a bottle from `origin` to the header basket.
 *
 * @returns how long the flight will take, in milliseconds. 0 when nothing
 *   flew — reduced motion, no basket on the page, a browser without the Web
 *   Animations API, or too many already in the air. Callers use it to hold
 *   the basket drawer back until the bottle has landed; a 0 means open now.
 */
export function flyToBasket(
  origin: Element | null | undefined,
  colours: FlightColours,
): number {
  if (typeof document === "undefined" || !origin) {
    pulseBasket();
    return 0;
  }

  const target = basketTarget();
  if (
    !target ||
    prefersReducedMotion() ||
    typeof Element.prototype.animate !== "function" ||
    inFlight >= MAX_IN_FLIGHT
  ) {
    pulseBasket();
    return 0;
  }

  const fromBox = origin.getBoundingClientRect();
  const toBox = target.getBoundingClientRect();
  if (fromBox.width === 0 || toBox.width === 0) {
    pulseBasket();
    return 0;
  }

  const from = centre(fromBox);
  const to = centre(toBox);
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  /* Distance-scaled, but bounded at both ends: a card just under the header
     should not snap, and a flight from the bottom of a long page should not
     become something you wait for. */
  const distance = Math.hypot(dx, dy);
  const duration = Math.round(Math.min(720, Math.max(430, distance * 0.6)));

  const wrap = document.createElement("div");
  wrap.style.cssText = `position:absolute;left:0;top:0;will-change:transform;transform:translate3d(${from.x}px,${from.y}px,0)`;

  const lift = document.createElement("div");
  /* Two drop-shadows, not one: the gold is what lifts a 30px silhouette off a
     near-black page at all, and the black one under it stops the gold reading
     as a smudge. `drop-shadow` follows the clip-path outline, which a
     box-shadow would not. */
  lift.style.cssText =
    "position:absolute;left:0;top:0;will-change:transform;filter:drop-shadow(0 0 9px rgba(212,166,60,0.55)) drop-shadow(0 6px 12px rgba(0,0,0,0.7))";

  const body = document.createElement("div");
  body.style.cssText = [
    "position:absolute",
    "left:0",
    "top:0",
    "width:30px",
    "height:46px",
    `background:linear-gradient(158deg, ${colours.accent} 0%, ${colours.accentDeep} 82%)`,
    `clip-path:${BOTTLE_CLIP}`,
    "will-change:transform,opacity",
    "transform:translate(-50%,-50%)",
  ].join(";");

  lift.appendChild(body);
  wrap.appendChild(lift);
  ensureLayer().appendChild(wrap);
  inFlight += 1;

  const x = wrap.animate(
    [
      { transform: `translate3d(${from.x}px,${from.y}px,0)` },
      { transform: `translate3d(${to.x}px,${from.y}px,0)` },
    ],
    {
      duration,
      // Decelerating: most of the horizontal travel happens early.
      easing: "cubic-bezier(0.22, 0.68, 0.32, 1)",
      fill: "forwards",
    },
  );

  lift.animate(
    [
      { transform: "translate3d(0,0,0)" },
      { transform: `translate3d(0,${dy}px,0)` },
    ],
    {
      duration,
      // Accelerating, against the X curve above — that difference is the arc.
      easing: "cubic-bezier(0.62, 0.02, 0.86, 0.36)",
      fill: "forwards",
    },
  );

  body.animate(
    [
      { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
      {
        transform: "translate(-50%,-50%) scale(0.62) rotate(-8deg)",
        opacity: 1,
        offset: 0.62,
      },
      {
        transform: "translate(-50%,-50%) scale(0.16) rotate(-16deg)",
        opacity: 0,
      },
    ],
    { duration, easing: "cubic-bezier(0.4, 0, 0.55, 1)", fill: "forwards" },
  );

  let done = false;
  const land = (arrived: boolean) => {
    if (done) return;
    done = true;
    inFlight -= 1;
    wrap.remove();
    if (arrived) pulseBasket();
  };

  x.finished.then(() => land(true)).catch(() => land(false));

  /* Belt and braces. A backgrounded tab suspends the document timeline, so
     `finished` may never resolve for a flight launched just before the user
     switched away; without this the node would sit on the page for good.
     `land` is idempotent, so whichever fires first wins. */
  window.setTimeout(() => land(false), duration + 4000);

  return duration;
}
