"use client";

import { useEffect, useRef } from "react";
import { DELIVERY, SOCIALS } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Where Stripe drops the customer after a successful payment.
 *
 * A client component on purpose: the basket has to be emptied here, because
 * this is the first moment the browser knows the money actually moved.
 */

export default function OrderConfirmedPage() {
  const { clear } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    // Guarded: clearing changes cart state, which changes `clear`'s identity.
    if (cleared.current) return;
    cleared.current = true;
    clear();
  }, [clear]);

  return (
    <>
      <title>Order confirmed · Juice Cartel</title>
      <meta name="robots" content="noindex" />

      <section className="bg-grain relative mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-label text-gold">
          Payment received
        </p>

        <h1 className="mt-6 font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl">
          <span className="text-foil">Thank you</span>
        </h1>

        <div className="rule-foil mt-8 w-40" />

        <p className="mt-8 max-w-md text-base leading-relaxed text-cream-dim">
          That&rsquo;s gone through. Stripe will email your receipt in the next
          minute or two, and we&rsquo;ve got everything we need to get your order
          out.
        </p>

        <ol className="mt-12 w-full max-w-sm space-y-5 text-left">
          <Step index="01" title="We press it fresh">
            Nothing is made until your order lands, which is why it tastes like
            it does.
          </Step>
          <Step index="02" title={`Delivered across ${DELIVERY.city}`}>
            We&rsquo;ll message you to confirm the drop before we set off.
          </Step>
          <Step index="03" title="Keep it cold">
            Straight in the fridge. Everything is best the day it arrives.
          </Step>
        </ol>

        <div className="mt-14 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/menu" variant="primary" size="lg">
            Order again
          </ButtonLink>
          <ButtonLink href={SOCIALS.instagram} variant="secondary" size="lg">
            Message us
          </ButtonLink>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-cream-faint">
          Something not right? Message {SOCIALS.handle} and we&rsquo;ll fix it.
        </p>
      </section>
    </>
  );
}

function Step({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 border-l border-ink-line pl-5">
      <div>
        <span className="numeric text-xs tracking-label text-gold-deep">
          {index}
        </span>
        <h2 className="mt-1 font-display text-base text-cream">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-cream-dim">
          {children}
        </p>
      </div>
    </li>
  );
}
