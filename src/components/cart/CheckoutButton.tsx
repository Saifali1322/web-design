"use client";

import { useEffect, useState } from "react";
import { DELIVERY, formatPrice, SOCIALS } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";

/**
 * The one button that spends money.
 *
 * It posts nothing but product ids, blend recipes, quantities and a postcode —
 * the server prices the order — then follows the Checkout Session URL Stripe
 * returns.
 *
 * The interesting half of this component is what happens when that doesn't
 * work. Every failure the route can return has a specific answer here, and
 * every answer has something to press: a stale product can be removed in one
 * click, a network blip can be retried without rebuilding the basket, and an
 * unconfigured shop says so plainly instead of throwing. A basket is the
 * worst possible place to hit a dead end.
 */

type Status = "checking" | "ready" | "unavailable" | "submitting";

/** A failure the customer can act on, rather than a sentence to read. */
interface Recovery {
  message: string;
  action?: { label: string; run: () => void };
}

interface CheckoutButtonProps {
  /** Raw postcode from the drawer field. Validated again server-side. */
  postcode: string;
  /** Why the button is off, so it can say so rather than just look grey. */
  blocked?: "minimum" | "postcode" | null;
  /** Set when the basket is under the minimum or the postcode isn't valid. */
  disabled?: boolean;
}

export default function CheckoutButton({
  postcode,
  blocked = null,
  disabled = false,
}: CheckoutButtonProps) {
  const { items, total, amountToMinimum, remove } = useCart();
  const [status, setStatus] = useState<Status>("checking");
  const [recovery, setRecovery] = useState<Recovery | null>(null);

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
    setRecovery(null);
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
        productId?: string;
      };

      if (res.status === 503 || payload.code === "stripe_unconfigured") {
        setStatus("unavailable");
        return;
      }

      if (!res.ok || !payload.url) {
        setRecovery(recoveryFor(payload, { remove, handleCheckout }));
        setStatus("ready");
        return;
      }

      // Hand off to Stripe. Deliberately not resetting status — the page is
      // leaving, and a button that flicks back to "Checkout" looks broken.
      window.location.assign(payload.url);
    } catch {
      setRecovery({
        message: reassure(
          "We couldn't reach the checkout. Check your connection — your basket is safe either way.",
        ),
        action: { label: "Try again", run: () => void handleCheckout() },
      });
      setStatus("ready");
    }
  }

  // Deliberately compact: this sits in the drawer's pinned footer, and every
  // line added here is a line taken off the basket itself. The waitlist form
  // lives on /subscribe and /delivery, where there is room for it.
  if (status === "unavailable") {
    return (
      <div className="border border-gold-dim/60 bg-ink-raised px-4 py-3.5">
        <p className="text-sm leading-relaxed text-cream-dim">
          <span className="text-cream">Card payment isn&rsquo;t live yet.</span>{" "}
          Your basket is saved — send it over and we&rsquo;ll sort it.
        </p>
        <a
          href={SOCIALS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center border border-gold bg-gold/10 px-4 py-3 text-xs font-medium uppercase tracking-label text-gold-bright transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Order via {SOCIALS.handle}
        </a>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <div>
      {recovery ? (
        <div
          role="alert"
          className="mb-3 border-l-2 border-warn bg-warn/[0.06] py-2.5 pl-3 pr-3"
        >
          <p className="text-sm leading-relaxed text-warn">
            {recovery.message}
          </p>
          {recovery.action ? (
            <button
              type="button"
              onClick={recovery.action.run}
              className="mt-2 text-[0.6875rem] uppercase tracking-label text-gold underline underline-offset-4 transition-colors hover:text-gold-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {recovery.action.label}
            </button>
          ) : null}
        </div>
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

      {/* A disabled button that doesn't say why is a dead end. */}
      <p className="mt-3 text-center text-xs leading-relaxed text-cream-faint">
        {blocked === "minimum" ? (
          <span className="text-warn">
            Add{" "}
            <span className="numeric">{formatPrice(amountToMinimum)}</span> more
            to reach the{" "}
            <span className="numeric">
              {formatPrice(DELIVERY.minimumOrder)}
            </span>{" "}
            minimum before checking out.
          </span>
        ) : blocked === "postcode" ? (
          <span className="text-warn">
            Enter a {DELIVERY.city} postcode we deliver to and the button opens
            up.
          </span>
        ) : (
          <>
            Secure payment by Stripe. Card details never touch our servers.
            You&rsquo;ll confirm your address on the next screen.
          </>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The one sentence anybody actually wants after a payment button misbehaves.
 *
 * It is appended to whatever the server said rather than replacing it, because
 * the server's message explains what to do and this one explains what it cost
 * — which, on a checkout that never started, is nothing. Only added where it
 * is unambiguously true: a Session that was never created cannot have taken
 * any money.
 */
function reassure(message: string): string {
  return /charged/i.test(message) ? message : `${message} Nothing has been charged.`;
}

/**
 * Turns a failed checkout into something to press.
 *
 * The codes here are exactly the ones `/api/checkout` returns; anything else
 * falls through to a retry, which is the right answer for a transient fault
 * and harmless for a permanent one.
 */
function recoveryFor(
  payload: { error?: string; code?: string; productId?: string },
  handlers: {
    remove: (key: string) => void;
    handleCheckout: () => Promise<void>;
  },
): Recovery {
  const retry = {
    label: "Try again",
    run: () => void handlers.handleCheckout(),
  };

  switch (payload.code) {
    case "unknown_product":
      // Something in the basket left the menu between adding and paying.
      return {
        message:
          payload.error ??
          "One of these isn't on the menu any more. Take it out and the rest can go through.",
        action: payload.productId
          ? {
              label: "Remove it and continue",
              run: () => {
                handlers.remove(`p:${payload.productId}`);
                void handlers.handleCheckout();
              },
            }
          : undefined,
      };

    case "invalid_blend":
      return {
        message:
          payload.error ??
          "One of your blends no longer works — a juice in it has come off the menu. Remove it and try again.",
      };

    case "below_minimum":
    case "out_of_area":
      // Both are already true statements about the basket, and both are fixed
      // above this button rather than by pressing anything in here.
      return { message: payload.error ?? "That order can't go through yet." };

    case "invalid_body":
      return {
        message:
          "Something in the basket didn't make sense to us. Refresh the page and it should clear.",
        action: {
          label: "Refresh",
          run: () => window.location.reload(),
        },
      };

    default:
      return {
        message: reassure(payload.error ?? "Something went wrong."),
        action: retry,
      };
  }
}
