"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Scroll reveal.
 *
 * Two things changed from the original blunt fade-up.
 *
 * First, entrances vary by what is arriving. A heading, a card, a hairline
 * rule and a paragraph are not the same object and should not enter the same
 * way — a card is heavy and comes further from below, a heading settles down
 * onto its baseline from slightly oversize, a rule draws itself rather than
 * fading. `variant` picks; the actual transforms live in globals.css so the
 * vocabulary is in the design system rather than scattered in inline styles.
 *
 * Second, the observers are shared. There is one IntersectionObserver and one
 * rAF-throttled scroll backstop for the entire document no matter how many
 * reveals are mounted — the previous version added a scroll listener and an
 * observer per instance, which on the menu page meant about thirty of each.
 *
 * The escape hatches that mattered still matter:
 *  - prefers-reduced-motion: content is shown immediately, no transition, no
 *    stagger. globals.css also forces the finished state in CSS, so the page
 *    is composed even if this component never runs.
 *  - no JavaScript: the hidden state is a class, so pages that use Reveal
 *    should ship the <noscript> rule in `revealNoScriptCss` (see page.tsx),
 *    otherwise a scripting-disabled browser would see empty sections.
 */

export const revealNoScriptCss =
  "[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}";

export type RevealVariant =
  | "rise"
  | "fade"
  | "settle"
  | "lift"
  | "sweep"
  | "rule"
  | "mask";

/* ------------------------------------------------------------------ *
 * Shared observation — one observer and one backstop for the document
 * ------------------------------------------------------------------ */

type Show = () => void;

const waiting = new Map<Element, Show>();
let observer: IntersectionObserver | null = null;
let bound = false;
let checkFrame: number | null = null;

/** Collect first, then fire: `show` deletes from the map we are iterating. */
function fire(targets: Element[]): void {
  for (const el of targets) {
    const show = waiting.get(el);
    if (!show) continue;
    unwatch(el);
    show();
  }
}

function runCheck(): void {
  checkFrame = null;
  if (waiting.size === 0) return;
  const vh = window.innerHeight;
  const due: Element[] = [];
  /* Read every box before showing anything, so a page full of reveals costs
     one layout pass rather than one per element. */
  for (const el of waiting.keys()) {
    if (el.getBoundingClientRect().top < vh) due.push(el);
  }
  fire(due);
}

function scheduleCheck(): void {
  if (checkFrame !== null) return;
  checkFrame = requestAnimationFrame(runCheck);
}

function bindBackstop(): void {
  if (bound) return;
  bound = true;
  /* IntersectionObserver only reports when the intersecting flag *changes*,
     so an element that moves from below the fold to above it inside a single
     frame — a restored scroll position, an in-page anchor, a very fast flick
     — can be skipped entirely and would then sit at opacity 0 for good. */
  window.addEventListener("scroll", scheduleCheck, { passive: true });
  window.addEventListener("resize", scheduleCheck, { passive: true });
}

function unbindBackstop(): void {
  if (!bound) return;
  bound = false;
  window.removeEventListener("scroll", scheduleCheck);
  window.removeEventListener("resize", scheduleCheck);
  observer?.disconnect();
  observer = null;
  if (checkFrame !== null) cancelAnimationFrame(checkFrame);
  checkFrame = null;
}

function unwatch(el: Element): void {
  waiting.delete(el);
  observer?.unobserve(el);
  if (waiting.size === 0) unbindBackstop();
}

function watch(el: Element, show: Show): () => void {
  if (!observer) {
    observer = new IntersectionObserver(
      (records) => {
        const due: Element[] = [];
        for (const record of records) {
          // Reveal on entry, but also if the element is already level with or
          // above the viewport — otherwise anything scrolled past between
          // observer frames never gets a second chance.
          const rootBottom = record.rootBounds?.bottom ?? window.innerHeight;
          const alreadyPassed = record.boundingClientRect.top < rootBottom;
          if (record.isIntersecting || alreadyPassed) due.push(record.target);
        }
        fire(due);
      },
      // threshold 0 so a single overlapping pixel counts; a tall section must
      // not have to get 8% of its own height on screen before it appears.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );
  }
  waiting.set(el, show);
  observer.observe(el);
  bindBackstop();
  return () => unwatch(el);
}

/* ------------------------------------------------------------------ *
 * Reveal
 * ------------------------------------------------------------------ */

export interface RevealProps {
  children: ReactNode;
  /** Stagger siblings, in seconds. */
  delay?: number;
  /** Distance travelled on the way in, in pixels. */
  distance?: number;
  /** How this thing should arrive. See the variants in globals.css. */
  variant?: RevealVariant;
  /** Renders an <li> instead of a <div> so lists stay valid. */
  as?: "div" | "li" | "span" | "section";
  className?: string;
  /** Set by RevealGroup to stagger and vary a run of siblings. */
  index?: number;
}

export function Reveal({
  children,
  delay,
  distance = 20,
  variant,
  as = "div",
  className = "",
  index,
}: RevealProps) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  /** Reveal with no transition and, importantly, no stagger delay. */
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setInstant(true);
      setShown(true);
      return;
    }

    return watch(node, () => setShown(true));
  }, []);

  const setRef = (node: HTMLElement | null) => {
    nodeRef.current = node;
  };

  /* A run of siblings alternates between two closely related entrances, so a
     grid never arrives as one rubber-stamped wave. The pair is chosen to
     differ in weight, not direction — alternating left/right would read as a
     gimmick, alternating how far and how heavily reads as hand-placed. */
  const resolved: RevealVariant =
    variant ?? (index !== undefined && index % 2 === 1 ? "lift" : "rise");

  /* Compressed, not metronomic. Evenly spaced delays are the thing that makes
     a staggered grid look machine-timed: the gap between the first and second
     item should be the largest, and each one after that should close up. The
     0.72 exponent gives roughly 90ms, 58ms, 48ms, 43ms — a run that settles
     rather than a metronome that keeps going. */
  const stagger =
    delay ?? (index !== undefined ? Math.pow(index, 0.72) * 0.09 : 0);

  const style: React.CSSProperties & Record<string, string | number> = {
    "--reveal-distance": `${distance}px`,
  };
  // The global reduced-motion rule zeroes durations but not delays, so the
  // stagger has to be dropped here or the content just arrives late.
  if (stagger && !instant) style.transitionDelay = `${stagger}s`;

  const props = {
    ref: setRef,
    "data-reveal": shown ? "in" : "out",
    "data-reveal-variant": resolved,
    ...(instant ? { "data-reveal-instant": "" } : null),
    className: className || undefined,
    style,
  };

  if (as === "li") return <li {...props}>{children}</li>;
  if (as === "span") return <span {...props}>{children}</span>;
  if (as === "section") return <section {...props}>{children}</section>;
  return <div {...props}>{children}</div>;
}

/* ------------------------------------------------------------------ *
 * RevealGroup
 * ------------------------------------------------------------------ */

export interface RevealGroupProps {
  children: ReactNode;
  /** Base seconds between siblings, before compression. Keep it under 0.12. */
  stagger?: number;
  className?: string;
  as?: "div" | "ul" | "ol";
}

/**
 * Wraps a run of Reveals and hands each one its position, so they stagger and
 * alternate without every call site having to hand-type a delay. Children
 * that already set `delay` or `variant` keep what they were given.
 */
export function RevealGroup({
  children,
  stagger = 0.07,
  className = "",
  as = "div",
}: RevealGroupProps) {
  let i = 0;
  const indexed = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<RevealProps>;
    if (el.props?.index !== undefined) return child;
    const next = i++;
    return cloneElement(el, {
      index: next,
      // Same compressed curve as the default above, honouring a custom base.
      delay: el.props?.delay ?? Math.pow(next, 0.72) * stagger,
    });
  });

  const props = { className: className || undefined };
  if (as === "ul") return <ul {...props}>{indexed}</ul>;
  if (as === "ol") return <ol {...props}>{indexed}</ol>;
  return <div {...props}>{indexed}</div>;
}

export default Reveal;
