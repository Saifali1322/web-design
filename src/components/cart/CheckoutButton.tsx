"use client";

import { useEffect, useState } from "react";
import { formatPrice, SOCIALS } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";

/**
 * The one button that spends money.
 *
 * It posts nothing but product ids, blend recipes, quantities and a postcode —
 * the server prices the order — then follows the Checkout Session URL Stripe
 * returns.
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
        // A failed probe is no reason to block ordering — let the POST be the
        // source of truth instead.
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
          // Ids, parts and quantities only. A blend goes up as its components,
          // not its price — the server prices it from the catalogue.
          lines: items.map((i) =>
            i.kind === "blend"
              ? {
                  kind: "blend" as const,
                  components: i.blend.components.map((c) => ({
                    juiceId: c.product.id,
                    parts: c.parts,
                  })),
                  name: i.name,
                  quantity: i.quantity,
                }
              : {
                  kind: "product" as const,
                  productId: i.product.id,
                  quantity: i.quantity,
                },
          ),
          postcode,
        }),
      });

      const data: unknown = await res.json().catch(() => null);
      const payload = (data ?? {}) as {
        url?: string;
        error?: string;
        code?: string;
      };

      if (res.status === 503 || payload.code === "stripe_unconfigured") {
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
      setError(
        "We couldn't reach the checkout. Check your connection and try again.",
      );
      setStatus("ready");
    }
  }

  if (status === "unavailable") {
    return (
      <p className="border border-gold-dim/60 bg-ink-raised px-4 py-3 text-sm leading-relaxed text-cream-dim">
        Ordering opens soon —{" "}
        <a
          href={SOCIALS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline underline-offset-2"
        >
          message us on Instagram
        </a>{" "}
        and we&apos;ll sort you out in the meantime.
      </p>
    );
  }

  const busy = status === "submitting";

  return (
    <div>
      {error ? (
        <p
          role="alert"
          className="mb-3 border-l-2 border-warn bg-warn/[0.06] py-2 pl-3 text-sm leading-relaxed text-warn"
        >
          {error}
        </p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleCheckout}
        disabled={disabled || busy || status === "checking" || items.length === 0}
        aria-busy={busy}
      >
        {busy ? (
          <span className="animate-pulse">Redirecting…</span>
        ) : (
          <>
            Checkout
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span className="numeric">{formatPrice(total)}</span>
          </>
        )}
      </Button>

      <p className="mt-3 text-center text-xs leading-relaxed text-cream-faint">
        Secure payment by Stripe. Card details never touch our servers.
      </p>
    </div>
  );
}
