"use client";

import { useId, useState } from "react";
import { DELIVERY, isInDeliveryArea } from "@/lib/catalogue";

/**
 * Self-contained postcode checker: instant in/out feedback as the customer
 * types, no submit button needed. Used standalone on /delivery, and again
 * as a quick upfront check on /subscribe before anyone picks a tier.
 */
export default function PostcodeCheck({
  className = "",
  onResult,
}: {
  className?: string;
  /** Optional hook for a parent that wants to know the latest check too. */
  onResult?: (postcode: string, inArea: boolean) => void;
}) {
  const inputId = useId();
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const inArea = trimmed.length === 0 ? null : isInDeliveryArea(trimmed);

  const handleChange = (next: string) => {
    setValue(next);
    const t = next.trim();
    if (t.length > 0) onResult?.(t, isInDeliveryArea(t));
  };

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-2 block text-xs uppercase tracking-label text-cream-dim"
      >
        Check your postcode
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="text"
        autoComplete="postal-code"
        placeholder="e.g. NG7 2RD"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="numeric w-full border border-ink-line bg-ink-raised px-4 py-3 text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none sm:max-w-sm"
      />

      <p role="status" aria-live="polite" className="mt-3 text-sm">
        {inArea === null && (
          <span className="text-cream-faint">
            Enter the first part of your postcode — we cover {DELIVERY.city}{" "}
            only, for now.
          </span>
        )}
        {inArea === true && (
          <span className="text-fresh">
            Good news — that&apos;s on our route. Drops go out every{" "}
            {DELIVERY.dropDay}.
          </span>
        )}
        {inArea === false && (
          <span className="text-warn">
            Not on the route yet. We currently deliver to {DELIVERY.city}{" "}
            postcodes only.
          </span>
        )}
      </p>
    </div>
  );
}
