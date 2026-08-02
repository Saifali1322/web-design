"use client";

import { DELIVERY, formatPrice } from "@/lib/catalogue";

/**
 * The two numbers that decide whether an order can happen at all.
 *
 * A £12 minimum and a £20 free-delivery threshold are not the same kind of
 * thing — one is a wall, the other is a reward — so they share one track but
 * never one message. Below the minimum the bar is a warning and says exactly
 * what is missing; above it, it is an offer.
 *
 * The bar is decorative; every state is also stated in words directly above it,
 * because a 60%-filled rectangle is not information. The width transition is a
 * CSS transition, so the global prefers-reduced-motion rule flattens it.
 */

const { minimumOrder, freeDeliveryThreshold, deliveryFee } = DELIVERY;

/** Where the minimum sits on a track that ends at the free-delivery threshold. */
const MINIMUM_MARK = (minimumOrder / freeDeliveryThreshold) * 100;

export default function DeliveryProgress({ subtotal }: { subtotal: number }) {
  const belowMinimum = subtotal < minimumOrder;
  const earned = subtotal >= freeDeliveryThreshold;
  const percent = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const toMinimum = Math.max(0, minimumOrder - subtotal);
  const toFree = Math.max(0, freeDeliveryThreshold - subtotal);

  const tone = belowMinimum
    ? { text: "text-warn", fill: "bg-warn" }
    : earned
      ? { text: "text-gold-bright", fill: "bg-gold-bright" }
      : { text: "text-gold", fill: "bg-gold" };

  const valueText = belowMinimum
    ? `${formatPrice(subtotal)} of the ${formatPrice(minimumOrder)} minimum order`
    : earned
      ? `${formatPrice(subtotal)} — free delivery earned`
      : `${formatPrice(subtotal)} of ${formatPrice(freeDeliveryThreshold)} towards free delivery`;

  return (
    <div className="mb-4">
      <p className={`text-sm leading-relaxed ${tone.text}`}>
        {belowMinimum ? (
          <>
            <span className="numeric font-medium">
              {formatPrice(toMinimum)}
            </span>{" "}
            to go before we can deliver — the minimum is{" "}
            <span className="numeric">{formatPrice(minimumOrder)}</span>.
          </>
        ) : earned ? (
          <>
            Free delivery unlocked —{" "}
            <span className="numeric">{formatPrice(deliveryFee)}</span>{" "}saved.
          </>
        ) : (
          <>
            <span className="numeric font-medium">{formatPrice(toFree)}</span>{" "}
            more and delivery is on us.
          </>
        )}
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={freeDeliveryThreshold}
        aria-valuenow={Math.min(subtotal, freeDeliveryThreshold)}
        aria-valuetext={valueText}
        aria-label="Progress towards free delivery"
        className="relative mt-2 h-1.5 w-full overflow-hidden bg-ink-line"
      >
        <div
          className={`h-full transition-[width] duration-700 ease-out ${tone.fill}`}
          style={{ width: `${percent}%` }}
        />
        {/* The minimum, marked on the track so the wall is visible before it
            is hit rather than explained after. */}
        <span
          aria-hidden
          className="absolute inset-y-0 w-px bg-ink"
          style={{ left: `${MINIMUM_MARK}%` }}
        />
      </div>

      <div
        aria-hidden
        className="mt-1 flex items-center justify-between text-[0.625rem] uppercase tracking-label text-cream-faint"
      >
        <span className="numeric">
          {formatPrice(minimumOrder)} min
        </span>
        <span className="numeric">
          {formatPrice(freeDeliveryThreshold)} free delivery
        </span>
      </div>
    </div>
  );
}
