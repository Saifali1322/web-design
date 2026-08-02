"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { installSpecularTracking } from "./motion";

/**
 * Makes horizontally scrollable regions reachable from a keyboard.
 *
 * An `overflow-x: auto` container whose content overflows can be panned with
 * a mouse or a finger and not at all without one — the allergen matrix is a
 * wide table that a keyboard user simply could not reach the right-hand
 * columns of. `tabindex="0"` makes it focusable, and the arrow keys then
 * scroll it. It also picks up the focus ring, so it is visibly reachable.
 *
 * Three guards, all of which mirror how axe decides:
 *  - a region that already contains something focusable is reachable by
 *    tabbing into its contents, and a stop in front of it is just an extra
 *    key press for everyone;
 *  - a region that does not currently overflow needs nothing;
 *  - anything that already carries a tabindex is left alone.
 *
 * The candidate set is narrowed by class name rather than walking the whole
 * document, because `getComputedStyle` on every element of the allergen page
 * would cost far more than the fix is worth. Every scroll container in this
 * codebase is authored with a Tailwind `overflow-*` class, so that is the
 * net that is cast.
 */
function makeScrollRegionsFocusable(): void {
  const FOCUSABLE =
    'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

  const candidates =
    document.querySelectorAll<HTMLElement>('[class*="overflow-"]');

  for (const el of candidates) {
    if (el.hasAttribute("tabindex")) continue;
    const overflowsX = el.scrollWidth > el.clientWidth + 1;
    const overflowsY = el.scrollHeight > el.clientHeight + 1;
    if (!overflowsX && !overflowsY) continue;

    const style = getComputedStyle(el);
    const scrolls =
      (overflowsX && /(auto|scroll)/.test(style.overflowX)) ||
      (overflowsY && /(auto|scroll)/.test(style.overflowY));
    if (!scrolls) continue;
    if (el.querySelector(FOCUSABLE)) continue;

    el.tabIndex = 0;
  }
}

/**
 * Document-level interaction polish. Renders nothing.
 *
 * This exists so that behaviour wanting a listener on the document — rather
 * than one per element — has a single place to live, mounted once from the
 * root layout. Anything else that is genuinely global belongs here too,
 * rather than becoming another stray listener somewhere.
 */
export function InteractionLayer() {
  const pathname = usePathname();

  useEffect(() => installSpecularTracking(), []);

  useEffect(() => {
    /* Whether a region overflows depends on the width it ended up with, so
       this is re-run after a resize as well as after a navigation. */
    let raf = requestAnimationFrame(makeScrollRegionsFocusable);
    let debounce: number | null = null;
    const onResize = () => {
      if (debounce) window.clearTimeout(debounce);
      debounce = window.setTimeout(makeScrollRegionsFocusable, 200);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      if (debounce) window.clearTimeout(debounce);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  return null;
}

export default InteractionLayer;
