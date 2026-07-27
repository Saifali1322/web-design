"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll reveal. Deliberately small: one observer per element, disconnected
 * the moment it fires, no scroll listeners.
 *
 * Two escape hatches matter here:
 *  - prefers-reduced-motion: content is shown immediately, no transition.
 *  - no JavaScript: the hidden state is a class, so pages that use Reveal
 *    should ship the <noscript> rule in `revealNoScriptCss` (see page.tsx),
 *    otherwise a scripting-disabled browser would see empty sections.
 */

export const revealNoScriptCss =
  "[data-reveal]{opacity:1!important;transform:none!important}";

export interface RevealProps {
  children: ReactNode;
  /** Stagger siblings, in seconds. */
  delay?: number;
  /** Distance travelled on the way in, in pixels. */
  distance?: number;
  /** Renders an <li> instead of a <div> so lists stay valid. */
  as?: "div" | "li";
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  distance = 20,
  as = "div",
  className = "",
}: RevealProps) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  /** Reveal with no transition and, importantly, no stagger delay. */
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      setInstant(true);
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Reveal on entry, but also if the element is already level with or
          // above the viewport. Without that second case anything scrolled
          // past between observer frames — a flicked phone, a deep link, a
          // restored scroll position — would stay at opacity 0 forever, since
          // the observer disconnects and never gets another chance.
          const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
          const alreadyPassed = entry.boundingClientRect.top < rootBottom;
          if (!entry.isIntersecting && !alreadyPassed) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      // threshold 0 so a single overlapping pixel counts; a tall section must
      // not have to get 8% of its own height on screen before it appears.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);

    // Backstop. IntersectionObserver only reports when the intersecting flag
    // *changes*, so an element that moves from below the fold to above it
    // within a single frame — a restored scroll position, an in-page anchor,
    // a very fast flick — can be skipped entirely and would then stay at
    // opacity 0 for good. This passive check costs nothing and unbinds itself
    // the moment the element is shown.
    let done = false;
    const stop = () => {
      done = true;
      observer.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
    function check() {
      if (done) return;
      // Top edge has reached the bottom of the viewport: it is either on
      // screen or already above it. Either way it must be visible.
      if (node!.getBoundingClientRect().top < window.innerHeight) {
        setShown(true);
        stop();
      }
    }
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });

    return stop;
  }, []);

  const setRef = (node: HTMLElement | null) => {
    nodeRef.current = node;
  };

  const classes = [
    instant
      ? ""
      : "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    // Offset is driven by the inline `transform` below, not a translate
    // utility — Tailwind v4 writes those to the separate `translate`
    // property, which this transition does not list.
    shown ? "opacity-100" : "opacity-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    // The global reduced-motion rule zeroes durations but not delays, so the
    // stagger has to be dropped here or the content just arrives late.
    transitionDelay: delay && !instant ? `${delay}s` : undefined,
    transform: shown ? undefined : `translateY(${distance}px)`,
  };

  if (as === "li") {
    return (
      <li ref={setRef} data-reveal={shown ? "in" : "out"} className={classes} style={style}>
        {children}
      </li>
    );
  }

  return (
    <div ref={setRef} data-reveal={shown ? "in" : "out"} className={classes} style={style}>
      {children}
    </div>
  );
}

export default Reveal;
