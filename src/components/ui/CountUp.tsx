"use client";

/**
 * A figure that counts up when it arrives.
 *
 * Four rules it does not break.
 *
 * The final value is what renders. Server, first paint, no JavaScript, no
 * IntersectionObserver, reduced motion — all of them show the real number, and
 * the count is something that happens to a figure that is already correct.
 * That is also why there is no hydration risk and no layout shift: React
 * renders the same string on both sides and the animation only ever writes to
 * the DOM after mount.
 *
 * It counts by writing `textContent`, never by setting state. One shared frame
 * loop drives every figure on the page, so a band of three stats costs one
 * rAF, and the loop stops itself the moment the last one finishes.
 *
 * The digits are hidden from assistive technology and the real value is
 * carried alongside in an `sr-only` span. Without that split a screen reader
 * traversing the page mid-count would read out whatever number the animation
 * happened to be on, which is worse than no animation at all.
 *
 * And the shape of what is written is fixed for the whole count, which is why
 * the props are a format name plus literal affixes rather than a formatter
 * function. Two reasons: the call sites are server components and a function
 * cannot cross that boundary, and a free-form formatter makes it far too easy
 * to author a count whose width changes as it runs — which shifts the layout
 * on every frame. Pair every use with the `.numeric` class, which is tabular.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";
import { watch } from "./Reveal";

/* Layout effects are what stop the first painted frame showing the final
   value and then snapping back to zero. There is nothing to run on the
   server, so the environment — which never changes mid-session — picks. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------ *
 * Formats
 * ------------------------------------------------------------------ */

export type CountUpFormat = "integer" | "money";

/**
 * Money is always two decimals here, unlike `formatPrice`, which drops a
 * trailing ".00". That is right for prose ("£12 minimum") and wrong for a
 * figure that is counting: "£0.42" becoming "£2" halfway would jump the
 * column three glyphs narrower. Same reasoning as `money()` in BlendPreview.
 */
function write(value: number, format: CountUpFormat): string {
  return format === "money" ? `£${(value / 100).toFixed(2)}` : `${value}`;
}

/* ------------------------------------------------------------------ *
 * One loop for every figure on the page
 * ------------------------------------------------------------------ */

interface Job {
  el: HTMLElement;
  to: number;
  duration: number;
  started: number;
  render: (n: number) => string;
}

const jobs = new Set<Job>();
let frame: number | null = null;

/** Decelerating. A linear count reads as a progress bar, not as a figure. */
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

function run(now: number): void {
  frame = null;
  for (const job of jobs) {
    const t = Math.min(1, (now - job.started) / job.duration);
    job.el.textContent = job.render(Math.round(job.to * easeOutCubic(t)));
    if (t >= 1) jobs.delete(job);
  }
  if (jobs.size > 0) frame = requestAnimationFrame(run);
}

function schedule(job: Job): void {
  jobs.add(job);
  if (frame === null) frame = requestAnimationFrame(run);
}

/* ------------------------------------------------------------------ *
 * CountUp
 * ------------------------------------------------------------------ */

export interface CountUpProps {
  /**
   * The real, final figure — pence when `format` is "money". Must come from
   * the catalogue or from something derived off it; this component animates a
   * number, it does not invent one. Zero is rendered and never animated,
   * because counting up to nothing undercuts the claim being made.
   */
  value: number;
  format?: CountUpFormat;
  /** Literal text before the figure, e.g. "Save ". */
  prefix?: string;
  /** Literal text after it, e.g. "/7", " days", " / week". */
  suffix?: string;
  /**
   * Used in place of `suffix` while the running figure is exactly 1. A count
   * on its way to "3 days" passes through 1, and "1 days" on the page — even
   * for four frames — is the sort of thing that makes a site look generated.
   * It is the one thing here allowed to change the string's width mid-count,
   * so only use it on a figure that is not sharing a line with anything.
   */
  suffixSingular?: string;
  /** Roughly 800–1200ms. Longer than that and it stops being a flourish. */
  duration?: number;
  className?: string;
}

export function CountUp({
  value,
  format = "integer",
  prefix = "",
  suffix = "",
  suffixSingular,
  duration = 1000,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const tail = (n: number) => (n === 1 && suffixSingular ? suffixSingular : suffix);
  const final = prefix + write(value, format) + tail(value);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      value === 0 ||
      prefersReducedMotion() ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const render = (n: number) =>
      prefix + write(n, format) + (n === 1 && suffixSingular ? suffixSingular : suffix);

    // Before the browser paints, so the final value never flashes first on a
    // figure that is already in the viewport when the page loads.
    el.textContent = render(0);

    let job: Job | null = null;
    const unwatch = watch(el, () => {
      job = { el, to: value, duration, started: performance.now(), render };
      schedule(job);
    });

    return () => {
      unwatch();
      // A route change mid-count would otherwise leave the loop writing to a
      // node that is no longer in the document.
      if (job) jobs.delete(job);
    };
  }, [value, format, prefix, suffix, suffixSingular, duration]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}

export default CountUp;
