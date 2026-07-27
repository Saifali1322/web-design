"use client";

import { useEffect, useState } from "react";
import { formatPrice, SOCIALS } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";

/**
 * The one button that spends money.
 *
 * It posts nothing but product ids, quantities and a postcode — the server
 * prices the order — then follows the Checkout Session URL Stripe returns.
 *
 * If the owner hasn't wired Stripe up yet the button doesn't exist at all;
 * in its place is a line pointing at Instagram, which is where orders actually
 * came from before this site existed.
 */

type Status = "checking" | "ready" | "unavailable" | "submitting";

interface CheckoutButtonProps {
  /** Raw postcode from the drawer field. Validated again server-side. */
  postcode: string;
  /** Set when the basket is under the minimum or the postcode isn't valid. */
  disabled?: boolean;
}

export default function CheckoutButton({
  postcode,
  disabled = false,
}: CheckoutButtonProps) {
  const { items, total } = useCart();
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  // Ask up front whether ordering is switched on, so the fallback shows before
  // anyone clicks rather than after.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/checkout", { method: "GET" });
        const data: unknown = await res.json();
        const configured =
          typeof data === "object" &&
          data !== null &&
          (data as { configured?: unknown }).configured === true;
        if (active) setStatus(configured ? "ready" : "unavailable");
      } catch {
        // Network hiccup on a probe is no reason to block ordering — let the
        // POST be the source of truth instead.
        if (active) setStatus("ready");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleCheckout() {
    if (status === "submitting") return;
    setError(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          postcode,
        }),
      });

      const data: unknown = await res.json().catch(() => null);
      const payload = (data ?? {}) as { url?: string; error?: string; code?: string };

      if (payload.code === "stripe_unconfigured") {
        setStatus("unavailable");
        return;
      }

      if (!res.ok || !payload.url) {
        setError(payload.error ?? "Something went wrong. Try again in a moment.");
        setStatus("ready");
        return;
      }

      // Hand off to Stripe. Deliberately not resetting status — the page is
      // leaving, and a button that flicks back to "Checkout" looks broken.
      window.location.assign(payload.url);
    } catch {
      setError("We couldn't reach the checkout. Check your connection and try again.");
      setStatus("ready");
    }
  }

  if (status === "unavailable") {
    return (
      <div className="border border-gold-deep/50 bg-ink-card px-4 py-4 text-center">
        <p className="font-display text-base tracking-wide text-cream">
          Ordering opens soon
        </p>
        <p className="mt-2 text-sm leading-relaxed text-cream-dim">
          Until then, message us on{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline decoration-gold-deep underline-offset-4 transition-colors hover:text-gold-bright"
          >
            Instagram
          </a>{" "}
          and we&rsquo;ll sort it.
        </p>
      </div>
    );
  }

  const busy = status === "submitting";
  const blocked = disabled || busy || status === "checking" || items.length === 0;

  return (
    <div>
      {error ? (
        <p
          role="alert"
          className="mb-3 border-l-2 border-warn bg-warn/5 py-2 pl-3 text-sm leading-relaxed text-warn"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={blocked}
        aria-busy={busy}
        className="
          group flex w-full items-center justify-center gap-3
          border border-gold bg-gold px-6 py-4
          font-sans text-xs font-medium uppercase tracking-label text-ink
          transition-all duration-300
          hover:bg-gold-bright hover:border-gold-bright
          focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold
          disabled:cursor-not-allowed disabled:border-ink-line disabled:bg-transparent
          disabled:text-cream-faint
        "
      >
        {busy ? (
          <span className="animate-pulse">Taking you to checkout</span>
        ) : (
          <>
            <span>Checkout</span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span className="numeric">{formatPrice(total)}</span>
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-cream-faint">
        Secure payment by Stripe. Card details never touch our servers.
      </p>
    </div>
  );
}
