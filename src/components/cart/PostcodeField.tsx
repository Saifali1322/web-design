"use client";

import Link from "next/link";
import { useId } from "react";
import { DELIVERY } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import {
  nearestCovered,
  useDeliveryPostcode,
} from "@/components/subscribe/postcode";

/**
 * The postcode, at the basket.
 *
 * Deliberately the same stored value as /delivery and /subscribe, so for most
 * people this field is already filled in and already green by the time they
 * see it. When it isn't, the answer arrives here rather than at Stripe: the
 * checkout button below stays disabled and says why, which is a far kinder
 * place to find out than a declined address on a payment page.
 */
export default function PostcodeField({
  className = "",
}: {
  className?: string;
}) {
  const fieldId = useId();
  const statusId = `${fieldId}-status`;
  const { closeCart } = useCart();
  const { postcode, setPostcode, status, outward } = useDeliveryPostcode();

  const near = status === "out" ? nearestCovered(postcode) : [];

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-xs uppercase tracking-label text-cream-dim"
      >
        Delivery postcode
      </label>

      <div className="relative">
        <input
          id={fieldId}
          name="postcode"
          type="text"
          inputMode="text"
          autoComplete="postal-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          required
          placeholder="e.g. NG7 2RD"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          aria-describedby={statusId}
          aria-invalid={status === "out" ? true : undefined}
          className={`numeric w-full border bg-ink-raised px-4 py-3 pr-11 uppercase text-cream transition-colors placeholder:normal-case placeholder:text-cream-faint focus:outline-none ${
            status === "out"
              ? "border-warn"
              : status === "in"
                ? "border-fresh/70"
                : "border-ink-line focus:border-gold"
          }`}
        />

        {status === "in" || status === "out" ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 ${
              status === "in" ? "text-fresh" : "text-warn"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              {status === "in" ? (
                <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" />
              ) : (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              )}
            </svg>
          </span>
        ) : null}
      </div>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className="mt-2 text-xs leading-relaxed"
      >
        {status === "in" ? (
          <span className="text-fresh">
            <span className="numeric">{outward}</span> is on the route — drops
            go out every {DELIVERY.dropDay}.
          </span>
        ) : status === "out" ? (
          <span className="text-warn">
            We don&rsquo;t reach <span className="numeric">{outward}</span> yet.
            {near.length > 0 ? (
              <>
                {" "}
                We do cover{" "}
                <span className="numeric">{near.join(", ")}</span>.
              </>
            ) : null}{" "}
            <Link
              href="/delivery"
              onClick={closeCart}
              className="text-gold underline underline-offset-2"
            >
              See the areas we cover
            </Link>
            .
          </span>
        ) : (
          <span className="text-cream-faint">
            {DELIVERY.city} only:{" "}
            <span className="numeric">{DELIVERY.postcodes.join(", ")}</span>
          </span>
        )}
      </p>
    </div>
  );
}
