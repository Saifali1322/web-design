/**
 * When the next drop is.
 *
 * `DELIVERY.dropDay` is a weekday name, not a date, so the actual next
 * occurrence has to be worked out from whenever "now" happens to be. That is
 * the whole job of this file, and it is deliberately pure: it takes a `Date`
 * and returns numbers, so it can be reasoned about without a clock and cannot
 * quietly become a build-time constant.
 *
 * Two cases are easy to get wrong and are handled explicitly.
 *
 * The drop day is today. Counting to "next Sunday" would say six days and
 * change when the van is out right now, so today is reported as today, with
 * the time left in it rather than a number of days.
 *
 * The drop day is tomorrow-ish. Days are counted from midnight to midnight,
 * not by dividing a duration by 86,400,000 — otherwise "1 day and 2 hours"
 * and "1 day and 23 hours" both round to one, and a run over a clock change
 * loses or gains an hour and takes the day count with it.
 */

/** Sunday-first, matching `Date.prototype.getDay`. */
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export interface NextDrop {
  /** True when the drop day is the day it already is. */
  isToday: boolean;
  /** Whole days until the drop day begins. 0 when it is today or tomorrow. */
  days: number;
  /** Hours left after those whole days, 0–23. */
  hours: number;
  /** Minutes left after those hours, 0–59. */
  minutes: number;
  /** Midnight at the start of the drop day, or the end of it when it is today. */
  at: Date;
}

/** Midnight at the start of the day `date` falls in, in local time. */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * How long until the next `dropDay`.
 *
 * @param now      the current instant. Passed in rather than read, so this is
 *                 testable and so a caller can be explicit about when it runs.
 * @param dropDay  a weekday name, e.g. `DELIVERY.dropDay`. An unrecognised
 *                 name resolves to Sunday rather than throwing: a countdown is
 *                 not worth a crashed page.
 */
export function nextDrop(now: Date, dropDay: string): NextDrop {
  const wanted = Math.max(
    0,
    WEEKDAYS.findIndex((d) => d.toLowerCase() === dropDay.trim().toLowerCase()),
  );

  const today = startOfDay(now);
  const isToday = now.getDay() === wanted;

  /* On the day itself the interesting figure is how much of it is left, so
     the target becomes the end of today rather than the same weekday a week
     out. Every other day counts to the start of the drop day. */
  const gap = isToday ? 1 : (wanted - now.getDay() + 7) % 7;
  const target = new Date(today);
  target.setDate(target.getDate() + gap);

  /* Whole days come off the calendar rather than off a duration. There is one
     fewer of them than there are day boundaries, except at exactly midnight,
     when no part of today has been used up yet. */
  const days = Math.max(0, gap - (now.getTime() > today.getTime() ? 1 : 0));

  /* The remainder is measured from the same wall-clock time `days` calendar
     days on, so it is always the part of one day that is left over — a clock
     change inside the window moves the hour, not the day count. */
  const afterDays = new Date(now);
  afterDays.setDate(afterDays.getDate() + days);
  const remainder = Math.max(0, target.getTime() - afterDays.getTime());

  return {
    isToday,
    days,
    hours: Math.floor(remainder / 3_600_000),
    minutes: Math.floor((remainder % 3_600_000) / 60_000),
    at: target,
  };
}
