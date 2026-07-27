"use client";

import { DELIVERY, formatPrice, SOCIALS } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Where Stripe drops the customer if they back out of checkout.
 *
 * Nothing has been charged and the basket is untouched, so the job of this page
 * is purely to say so and hand the basket straight back.
 */

export default function OrderCancelledPage() {
  const { count, openCart } = useCart();

  return (
    <>
      <title>Checkout cancelled · Juice Cartel</title>
      <meta name="robots" content="noindex" />

      <section className="bg-grain relative mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-label text-cream-faint">
          Checkout cancelled
        </p>

        <h1 className="mt-6 font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl">
          <span className="text-foil">No charge made</span>
        </h1>

        <div className="rule-foil mt-8 w-40" />

        <p className="mt-8 max-w-md text-base leading-relaxed text-cream-dim">
          You left checkout before paying, so nothing was taken.{" "}
          {count > 0
            ? "Your basket is exactly where you left it."
            : "Your basket is empty whenever you fancy starting one."}
        </p>

        <div className="mt-12 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          {count > 0 ? (
            <Button variant="primary" size="lg" onClick={openCart}>
              Reopen basket
            </Button>
          ) : null}
          <ButtonLink
            href="/menu"
            variant={count > 0 ? "secondary" : "primary"}
            size="lg"
          >
            Back to the menu
          </ButtonLink>
        </div>

        <p className="mt-12 text-xs leading-relaxed text-cream-faint">
          {DELIVERY.city} delivery · Minimum order{" "}
          <span className="numeric">{formatPrice(DELIVERY.minimumOrder)}</span> ·
          Free over{" "}
          <span className="numeric">
            {formatPrice(DELIVERY.freeDeliveryThreshold)}
          </span>
        </p>

        <p className="mt-3 text-xs leading-relaxed text-cream-faint">
          Card trouble? Message{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline decoration-gold-deep underline-offset-4 transition-colors hover:text-gold-bright"
          >
            {SOCIALS.handle}
          </a>{" "}
          and we&rsquo;ll take it from there.
        </p>
      </section>
    </>
  );
}
