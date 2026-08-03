"use client";

/**
 * How long until the next drop.
 *
 * Genuinely live: the catalogue holds a weekday name, not a date, and the
 * distance to the next one of those is worked out from the clock every time
 * (see `lib/dates.ts`). There is no build-time constant anywhere in it, which
 * matters because every page on this site is prerendered — a figure computed
 * on the server would be however old the last deploy is.
 *
 * That is also why it renders the day name first and the countdown second.
 * The server and the first client render both produce "Sunday", which is
 * true, complete and identical on both sides, so there is nothing to
 * mismatch, nothing to reserve and nothing missing with JavaScript off. The
 * live figure replaces it one tick after hydration.
 *
 * Days and hours, or hours and minutes inside the last day. Deliberately no
 * seconds: a ticking second hand pulls the eye off the page it is meant to be
 * selling, and the granularity is a lie anyway — the van leaves when it
 * leaves. The state therefore changes once a minute, which is not per-frame
 * work by any reading of it, so this is a plain interval rather than another
 * subscriber on a motion loop.
 */

import { useEffect, useState } from "react";
import { DELIVERY } from "@/lib/catalogue";
import { nextDrop, type NextDrop } from "@/lib/dates";

/** Number and unit, set the way every other figure on the site is set. */
function Figure({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      {value}
      <span className="font-sans text-2xs tracking-[0.14em] text-cream-faint uppercase">
        {unit}
      </span>
    </span>
  );
}

export interface DropCountdownProps {
  className?: string;
}

export function DropCountdown({ className = "" }: DropCountdownProps) {
  /** Null until mounted — see the note above about prerendering. */
  const [drop, setDrop] = useState<NextDrop | null>(null);

  useEffect(() => {
    const tick = () => setDrop(nextDrop(new Date(), DELIVERY.dropDay));
    tick();

    const timer = window.setInterval(tick, 60_000);
    /* A tab left open overnight would otherwise come back showing yesterday's
       figure until the next interval fires. */
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  /* Before the clock is read there is still something true to say, and the
     label has to agree with it — "Next drop in Sunday" would be the sort of
     mismatch a placeholder usually introduces. */
  let label = "Next drop";
  let shown = <>{DELIVERY.dropDay}</>;
  let spoken = `The next drop is on ${DELIVERY.dropDay}.`;

  if (drop?.isToday) {
    label = "The drop is";
    shown = <>Today</>;
    spoken = "The next drop is today.";
  } else if (drop && drop.days > 0) {
    label = "Next drop in";
    shown = (
      <>
        <Figure value={drop.days} unit={drop.days === 1 ? "day" : "days"} />{" "}
        <Figure value={drop.hours} unit={drop.hours === 1 ? "hr" : "hrs"} />
      </>
    );
    spoken = `The next drop is in ${drop.days} ${drop.days === 1 ? "day" : "days"} and ${drop.hours} ${drop.hours === 1 ? "hour" : "hours"}.`;
  } else if (drop) {
    label = "Next drop in";
    // Inside the last hour, drop the "0 hrs" — a leading zero unit reads as a
    // stopped clock rather than an imminent one.
    const mins = (
      <Figure value={drop.minutes} unit={drop.minutes === 1 ? "min" : "mins"} />
    );
    shown =
      drop.hours > 0 ? (
        <>
          <Figure value={drop.hours} unit={drop.hours === 1 ? "hr" : "hrs"} />{" "}
          {mins}
        </>
      ) : (
        mins
      );
    spoken =
      drop.hours > 0
        ? `The next drop is in ${drop.hours} ${drop.hours === 1 ? "hour" : "hours"} and ${drop.minutes} ${drop.minutes === 1 ? "minute" : "minutes"}.`
        : `The next drop is in ${drop.minutes} ${drop.minutes === 1 ? "minute" : "minutes"}.`;
  }

  return (
    <div
      className={`inline-block border border-ink-line bg-ink-card px-5 py-4 ${className}`}
    >
      <p className="text-label tracking-label text-gold uppercase">{label}</p>
      {/* The figures are hidden from assistive technology and the same fact is
          carried below as a sentence: "5 days 15 hrs" is a layout, not a
          reading, and the abbreviations only work because they are next to
          numerals somebody can see. */}
      <p
        aria-hidden="true"
        className="numeric text-foil mt-1.5 font-display text-3xl leading-none font-medium"
      >
        {shown}
      </p>
      <span className="sr-only">{spoken}</span>
    </div>
  );
}

export default DropCountdown;
