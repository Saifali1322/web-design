"use client";

import { useCallback, useEffect, useState } from "react";
import { DELIVERY, isInDeliveryArea } from "@/lib/catalogue";

/**
 * One postcode, shared by everything that needs it.
 *
 * The route covers eleven outward codes, so the postcode decides whether the
 * whole shop is even relevant to the person reading it. Asking for it three
 * times — once on /delivery, once on /subscribe, once at the basket — is how a
 * small delivery area feels like an obstacle course. So it is typed once, kept
 * in localStorage, and pushed to every mounted consumer immediately.
 *
 * Lives beside PostcodeCheck because that is where the check already lived and
 * where /delivery already imports from.
 */

/** Same key the basket has always used, so an existing one carries over. */
export const POSTCODE_KEY = "jc.postcode.v1";

/**
 * `typing` is the state that matters: "N" is not a postcode outside the area,
 * it is an unfinished one, and telling somebody they're out of area after one
 * keystroke is the rudest thing this form could do.
 */
export type PostcodeStatus = "empty" | "typing" | "in" | "out";

/** UK outward codes: A9, A99, A9A, AA9, AA99, AA9A. */
const OUTWARD_SHAPE = /^[A-Z]{1,2}\d[A-Z\d]?$/;

/** Uppercased, single-spaced. "  ng7  2rd " → "NG7 2RD". */
export const formatPostcode = (raw: string): string =>
  raw.trim().toUpperCase().replace(/\s+/g, " ");

/**
 * The outward code, split on either the space or the inward part. "NG72RD"
 * without a space still resolves — people type it both ways.
 */
export function outwardOf(raw: string): string {
  const formatted = formatPostcode(raw);
  const spaced = formatted.split(" ")[0] ?? "";
  if (spaced.length <= 4) return spaced;
  // No space typed: the inward code is always three characters at the end.
  return spaced.slice(0, -3);
}

export function postcodeStatus(raw: string): PostcodeStatus {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "empty";
  const outward = outwardOf(trimmed);
  if (!OUTWARD_SHAPE.test(outward)) return "typing";
  return isInDeliveryArea(outward) ? "in" : "out";
}

/**
 * Nearest covered codes to one we don't cover, so an out-of-area answer can
 * still be specific. Matched on the letter prefix — someone in NG10 is being
 * told about NG9, not about a code in another county.
 */
export function nearestCovered(raw: string): string[] {
  const outward = outwardOf(raw);
  const letters = outward.replace(/\d.*$/, "");
  if (!letters) return [];
  return (DELIVERY.postcodes as readonly string[]).filter((code) =>
    code.startsWith(letters),
  );
}

/* ---------- the shared value ---------- */

let current = "";
const listeners = new Set<(value: string) => void>();

function broadcast(value: string) {
  current = value;
  for (const listener of listeners) listener(value);
}

/**
 * Reads and writes the one postcode.
 *
 * `ready` is false for the first paint so a consumer can avoid flashing an
 * empty field at somebody whose postcode is already saved.
 */
export function useDeliveryPostcode() {
  const [postcode, setPostcodeState] = useState(current);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const listener = (value: string) => setPostcodeState(value);
    listeners.add(listener);

    // First consumer to mount seeds the shared value from storage.
    if (current === "") {
      try {
        const saved = localStorage.getItem(POSTCODE_KEY);
        if (saved) broadcast(saved);
      } catch {
        // Private mode or blocked storage; the field just starts empty.
      }
    } else {
      setPostcodeState(current);
    }

    setReady(true);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setPostcode = useCallback((value: string) => {
    broadcast(value);
    try {
      if (value.trim()) {
        localStorage.setItem(POSTCODE_KEY, value);
      } else {
        localStorage.removeItem(POSTCODE_KEY);
      }
    } catch {
      // Not worth surfacing — it still works for this session.
    }
  }, []);

  return {
    postcode,
    setPostcode,
    ready,
    status: postcodeStatus(postcode),
    outward: outwardOf(postcode),
    formatted: formatPostcode(postcode),
  } as const;
}
