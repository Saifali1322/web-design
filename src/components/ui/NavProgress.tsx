"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * A hairline that reports navigation.
 *
 * The App Router exposes no navigation events, so the start is detected from
 * a capture-phase click on any same-origin link and the end from the pathname
 * actually changing. That is enough: the only thing this has to be right
 * about is "something was asked for and has not arrived yet".
 *
 * There is no React state here at all, and no frame loop. The indeterminate
 * crawl is a CSS animation on `scaleX` — one promoted layer, zero main-thread
 * work per frame — and finishing it reads the live transform once so the bar
 * completes from wherever it had got to instead of snapping back to zero
 * (which is what happens if you simply drop the animation and transition to
 * the base value).
 *
 * Reduced motion: globals.css collapses the durations, so the bar appears,
 * completes and goes, without the crawl. It is an indeterminate status
 * indicator either way.
 */
export function NavProgress() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const running = useRef(false);
  const timeout = useRef<number | null>(null);

  /* --- start ------------------------------------------------------- */
  useEffect(() => {
    const start = () => {
      const el = barRef.current;
      if (!el || running.current) return;
      running.current = true;
      el.style.cssText = "";
      el.setAttribute("data-state", "loading");

      // A navigation that never resolves must not leave a bar sitting there.
      if (timeout.current) window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => finish(), 12000);
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page, or a jump to an anchor on it — nothing is being fetched.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      start();
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", start);
      if (timeout.current) window.clearTimeout(timeout.current);
    };
  }, []);

  /* --- finish ------------------------------------------------------ */
  const finish = () => {
    const el = barRef.current;
    if (!el || !running.current) return;
    running.current = false;
    if (timeout.current) window.clearTimeout(timeout.current);

    /* Read where the crawl actually got to. Without this the bar would snap
       back to zero the instant the animation is dropped, because a finished
       animation stops overriding the base value. */
    let at = 0;
    const matrix = window.getComputedStyle(el).transform;
    if (matrix && matrix !== "none") {
      const values = matrix.match(/-?[\d.]+/g);
      if (values?.length) at = parseFloat(values[0]);
    }

    el.setAttribute("data-state", "done");
    el.style.animation = "none";
    el.style.transform = `scaleX(${at})`;
    void el.offsetWidth; // commit the frozen position before transitioning
    el.style.transition =
      "transform 200ms var(--ease-out-quint), opacity 260ms 180ms linear";
    el.style.transform = "scaleX(1)";
    el.style.opacity = "0";
  };

  useEffect(() => {
    finish();
    // Runs on every completed navigation; on first mount nothing is running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    /* aria-hidden: Next already announces route changes to screen readers via
       its own route announcer, and a second running commentary is noise. */
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[2px]"
    >
      <div
        ref={barRef}
        className="nav-progress h-full w-full origin-left bg-[linear-gradient(90deg,#8a6015_0%,#d4a63c_45%,#f3da8b_100%)]"
      />
    </div>
  );
}

export default NavProgress;
