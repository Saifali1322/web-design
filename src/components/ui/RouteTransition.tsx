"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Gives an arriving page an entrance instead of a white flash.
 *
 * Two things are worth knowing about how this is built.
 *
 * It does not remount the subtree on navigation (no `key={pathname}`). The
 * animation is restarted by removing the class, forcing one reflow and adding
 * it back, which costs a single synchronous layout per navigation rather than
 * throwing away and rebuilding the page's DOM.
 *
 * It picks between a moving arrival and a fade based on what is on the page.
 * An element with an animating `transform` becomes the containing block for
 * every `position: fixed` descendant, and `position: sticky` inside it stops
 * resolving against the viewport — so the mixer's fixed bottom bar would ride
 * up the page and the allergen table's frozen first column would drift, for
 * as long as the animation ran. Pages carrying either get the flat variant.
 * That is a correctness decision, not a performance tier.
 *
 * The work happens in a layout effect so the first painted frame is already
 * the animation's start state; there is no flash of the finished page. The
 * initial page load is deliberately left alone — competing with the hero's
 * own entrance would only delay the largest paint.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const firstPaint = useRef(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    // Reduced motion gets the page, immediately, with nothing moving.
    if (prefersReducedMotion()) return;

    const holdsFixedChrome = el.querySelector(".fixed, .sticky") !== null;

    el.classList.remove("route-enter", "route-enter-flat");
    // Forces the removal to take effect so the animation restarts rather than
    // being treated as still-running.
    void el.offsetWidth;
    el.classList.add(holdsFixedChrome ? "route-enter-flat" : "route-enter");
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}

export default RouteTransition;
