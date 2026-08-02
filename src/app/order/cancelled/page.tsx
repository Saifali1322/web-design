"use client";

import Link from "next/link";
import { DELIVERY, formatPrice, SOCIALS } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Where Stripe drops the customer if they back out of checkout.
 *
 * Nothing has been charged and the basket is untouched, so the first job is to
 * say so in the largest type on the page — "did that take my money?" is the
 * only question anybody has here.
 *
 * The second job is to fix whatever sent them back. People leave a payment
 * page for a handful of reasons and almost all of them are recoverable in one
 * click, so each one gets its answer rather than a shrug and a link home.
 */

export default function OrderCancelledPage() {
  const { count, items, subtotal, total, hydrated, openCart } = useCart();
  const hasBasket = hydrated && count > 0;

  return (
    <>
      <title>Checkout cancelled · Juice Cartel</title>
      <meta name="robots" content="noindex" />

      <div className="bg-grain">
        <section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="text-xs uppercase tracking-label text-cream-faint">
            Checkout cancelled
          </p>

          <h1 className="mt-6 font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl">
            <span className="text-foil">No charge made</span>
          </h1>

          <div className="rule-foil mx-auto mt-8 w-40" />

          <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-cream-dim">
            You left checkout before paying, so nothing was taken and no card
            details were stored.{" "}
            {hasBasket
              ? "Your basket is exactly where you left it."
              : "Start a basket whenever you fancy it."}
          </p>
        </section>

        {/* ---------- The basket, still there ---------- */}
        {hasBasket ? (
          <section
            aria-labelledby="basket"
            className="mx-auto w-full max-w-2xl px-5 sm:px-8"
          >
            <h2 id="basket" className="sr-only">
              Your basket
            </h2>
            <div className="border border-ink-line bg-ink-card">
              <ul className="divide-y divide-ink-line px-6">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-baseline justify-between gap-4 py-3.5"
                  >
                    <span className="min-w-0 text-sm text-cream">
                      {item.quantity > 1 ? (
                        <span className="numeric text-cream-faint">
                          {item.quantity} ×{" "}
                        </span>
                      ) : null}
                      {item.name}
                    </span>
                    <span className="numeric shrink-0 text-sm text-cream-dim">
                      {formatPrice(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-baseline justify-between gap-4 border-t border-ink-line px-6 py-4">
                <span className="text-xs uppercase tracking-label text-cream-faint">
                  {subtotal === total ? "Total" : "Total with delivery"}
                </span>
                <span className="numeric font-display text-2xl text-foil">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* sm:flex-1 rather than width alone — two full-width buttons in a
                flex row still size to their labels, and a pair of unequal
                slabs is the sort of thing that reads as unfinished. */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="sm:flex-1"
                onClick={openCart}
              >
                Pick up where you left off
              </Button>
              <ButtonLink
                href="/menu"
                variant="secondary"
                size="lg"
                fullWidth
                className="sm:flex-1"
              >
                Add something else
              </ButtonLink>
            </div>
          </section>
        ) : (
          <section className="mx-auto w-full max-w-2xl px-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href="/menu" variant="primary" size="lg">
                Back to the menu
              </ButtonLink>
              <ButtonLink href="/mixer" variant="secondary" size="lg">
                Build a blend
              </ButtonLink>
            </div>
          </section>
        )}

        {/* ---------- Why people end up here ---------- */}
        <section
          aria-labelledby="reasons"
          className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8"
        >
          <h2
            id="reasons"
            className="mb-6 font-display text-2xl text-foil sm:text-3xl"
          >
            If something went wrong
          </h2>

          <dl className="divide-y divide-ink-line border-y border-ink-line">
            <Reason title="The card was declined">
              Stripe doesn&rsquo;t tell us why — your bank does. Try another
              card, or check for a confirmation prompt in your banking app and
              start the checkout again.
            </Reason>
            <Reason title="It asked for an address outside our area">
              We deliver to {DELIVERY.postcodes.length} {DELIVERY.city} outward
              codes only.{" "}
              <Link
                href="/delivery"
                className="text-gold underline underline-offset-2"
              >
                Check yours here
              </Link>{" "}
              before trying again — collection may still work.
            </Reason>
            <Reason title="You changed your mind about an item">
              Nothing is locked in. Reopen the basket, change the quantities or
              take something out, and check out again when it&rsquo;s right.
            </Reason>
            <Reason title="It just didn't work">
              Message {SOCIALS.handle} and tell us what you saw. Orders came in
              by message long before this site existed and they still can.
            </Reason>
          </dl>
        </section>

        <section className="mx-auto w-full max-w-2xl px-5 pb-24 text-center sm:px-8">
          <p className="text-xs leading-relaxed text-cream-faint">
            {DELIVERY.city} delivery · Minimum order{" "}
            <span className="numeric">
              {formatPrice(DELIVERY.minimumOrder)}
            </span>{" "}
            · Free over{" "}
            <span className="numeric">
              {formatPrice(DELIVERY.freeDeliveryThreshold)}
            </span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-cream-faint">
            Still stuck? Message{" "}
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline decoration-gold-deep underline-offset-4 transition-colors hover:text-gold-bright"
            >
              {SOCIALS.handle}
            </a>{" "}
            or call{" "}
            <a
              href={`tel:${SOCIALS.phone}`}
              className="numeric text-gold underline decoration-gold-deep underline-offset-4 transition-colors hover:text-gold-bright"
            >
              {SOCIALS.phone}
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}

function Reason({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4">
      <dt className="font-medium text-cream">{title}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-cream-dim">
        {children}
      </dd>
    </div>
  );
}
