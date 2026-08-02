"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DELIVERY, SOCIALS } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import EmailCapture from "@/components/marketing/EmailCapture";
import { ButtonLink } from "@/components/ui/Button";
import { ORDER_POLICY } from "@/app/order/policy";

/**
 * Where Stripe drops the customer after a successful payment.
 *
 * This is the highest-trust moment the shop ever gets: money has moved, and
 * the person is still looking. So it does three jobs rather than one — it
 * confirms what was actually bought (read back from Stripe, not from the
 * basket we just emptied), it says what happens next, and it gives a
 * reference and a human to contact if it doesn't.
 *
 * A client component on purpose: the basket has to be emptied here, because
 * this is the first moment the browser knows the money actually moved.
 *
 * Nothing on this page promises a delivery time, a change window or a refund —
 * see `src/app/order/policy.ts`. Those are the owner's to set, and until he
 * does, "message us" is the only thing that is true.
 */

/** What `/api/checkout/session` gives back. Deliberately narrow — see stripe.ts. */
interface OrderSummary {
  kind: "one-off" | "subscription";
  paid: boolean;
  reference: string;
  total: number | null;
  currency: string;
  items: Array<{ name: string; quantity: number; amount: number | null }>;
  email: string | null;
  postcode: string | null;
  plan: string | null;
}

export default function OrderConfirmedPage() {
  return (
    <>
      <title>Order confirmed · Juice Cartel</title>
      <meta name="robots" content="noindex" />
      {/* useSearchParams needs a boundary; the fallback is the same page
          without the receipt, which is exactly the no-Stripe state anyway. */}
      <Suspense fallback={<Confirmation summary={null} loading />}>
        <Confirmed />
      </Suspense>
    </>
  );
}

function Confirmed() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const isSubscription = params.get("plan") === "weekly";

  const { clear } = useCart();
  const cleared = useRef(false);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  // Only empty the basket for somebody Stripe actually sent here. Typing this
  // URL by hand, or landing on it from history, must not silently bin an
  // order that was never paid for.
  useEffect(() => {
    if (!sessionId || cleared.current) return;
    cleared.current = true;
    clear();
  }, [sessionId, clear]);

  // Read the order back. Every failure is silent: the page below already
  // works without it, and "we couldn't load your receipt" is a worrying thing
  // to read straight after paying.
  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data: unknown = await res.json().catch(() => null);
        const order = (data as { order?: OrderSummary } | null)?.order;
        if (active && res.ok && order) setSummary(order);
      } catch {
        // Offline, or ordering isn't wired up. Fall through to the generic page.
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionId]);

  return (
    <Confirmation
      summary={summary}
      loading={loading}
      subscription={isSubscription || summary?.kind === "subscription"}
    />
  );
}

/* ------------------------------------------------------------------ */

function Confirmation({
  summary,
  loading,
  subscription = false,
}: {
  summary: OrderSummary | null;
  loading: boolean;
  subscription?: boolean;
}) {
  return (
    <div className="bg-grain">
      <section className="mx-auto w-full max-w-2xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24">
        <p className="text-xs uppercase tracking-label text-gold">
          {subscription ? "Subscription started" : "Payment received"}
        </p>

        <h1 className="mt-6 font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl">
          <span className="text-foil">Thank you</span>
        </h1>

        <div className="rule-foil mx-auto mt-8 w-40" />

        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-cream-dim">
          {subscription ? (
            <>
              That&rsquo;s set up. Stripe will email your receipt in the next
              minute or two, and your first drop joins the next{" "}
              {DELIVERY.dropDay} run.
            </>
          ) : (
            <>
              That&rsquo;s gone through. Stripe will email your receipt in the
              next minute or two, and we&rsquo;ve got everything we need to get
              your order out.
            </>
          )}
        </p>
      </section>

      {/* ---------- The order itself ---------- */}
      <section
        aria-labelledby="receipt"
        className="mx-auto w-full max-w-2xl px-5 sm:px-8"
      >
        <h2 id="receipt" className="sr-only">
          Your order
        </h2>

        {loading ? (
          <div
            className="border border-ink-line bg-ink-card p-6 text-sm text-cream-faint"
            aria-live="polite"
          >
            Loading your order…
          </div>
        ) : summary ? (
          <Receipt summary={summary} />
        ) : (
          // No session id, Stripe not wired up, or the lookup failed. The
          // receipt Stripe emails is the record either way, so say that.
          <div className="border border-ink-line bg-ink-card p-6">
            <p className="text-sm leading-relaxed text-cream-dim">
              Your emailed receipt from Stripe is the record of what you
              ordered and what you paid. If it hasn&rsquo;t arrived within a
              few minutes, check your spam folder, then message us.
            </p>
          </div>
        )}
      </section>

      {/* ---------- What happens next ---------- */}
      <section
        aria-labelledby="next"
        className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8"
      >
        <h2
          id="next"
          className="mb-6 font-display text-2xl text-foil sm:text-3xl"
        >
          What happens next
        </h2>

        <ol className="space-y-6">
          {subscription ? (
            <>
              <Step index="01" title="Your first drop">
                You join the next {DELIVERY.dropDay} run across {DELIVERY.city}.
                We&rsquo;ll message you to confirm the drop before we set off.
              </Step>
              <Step index="02" title="Then every week, same day">
                Payment is taken automatically once a week, ahead of each{" "}
                {DELIVERY.dropDay}, on the card you just used. A receipt comes
                with every one.
              </Step>
              <Step index="03" title="Swap, skip or stop">
                Message {SOCIALS.handle} before the drop to change your
                flavours or skip a week.
                {ORDER_POLICY.subscriptionCutoff
                  ? ` ${ORDER_POLICY.subscriptionCutoff}`
                  : ""}{" "}
                Cancelling has no fee and no notice period — the link in your
                Stripe receipt manages the payment side, and a message to us
                takes you off the route.
              </Step>
            </>
          ) : (
            <>
              <Step index="01" title="We press it fresh">
                Nothing is made until your order lands, which is why it tastes
                like it does.
                {ORDER_POLICY.leadTime ? ` ${ORDER_POLICY.leadTime}` : ""}
              </Step>
              <Step index="02" title={`Delivered across ${DELIVERY.city}`}>
                We&rsquo;ll message you to confirm the drop before we set off,
                so you know when to expect us.
              </Step>
              <Step index="03" title="Keep it cold">
                Straight in the fridge. Everything is unpasteurised and best the
                day it arrives —{" "}
                <Link
                  href="/allergens"
                  className="text-gold underline underline-offset-2"
                >
                  allergen information is here
                </Link>{" "}
                if you need to check anything.
              </Step>
            </>
          )}
        </ol>
      </section>

      {/* ---------- Reaching a human ---------- */}
      <section
        aria-labelledby="help"
        className="mx-auto w-full max-w-2xl px-5 pb-14 sm:px-8"
      >
        <div className="border border-ink-line bg-ink-card p-6 sm:p-7">
          <h2 id="help" className="font-display text-xl text-foil">
            Need to change something?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-cream-dim">
            {ORDER_POLICY.changeWindow ??
              "Message us as soon as you can and we'll do what we can — a real person reads it."}
            {summary ? (
              <>
                {" "}
                Quote{" "}
                <span className="numeric text-cream">{summary.reference}</span>{" "}
                and we&rsquo;ll find your order straight away.
              </>
            ) : null}
          </p>

          {ORDER_POLICY.refunds ? (
            <p className="mt-3 text-sm leading-relaxed text-cream-dim">
              {ORDER_POLICY.refunds}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
            >
              {SOCIALS.handle} on Instagram
            </a>
            <a
              href={`tel:${SOCIALS.phone}`}
              className="numeric text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
            >
              {SOCIALS.phone}
            </a>
          </div>

          {ORDER_POLICY.supportHours ? (
            <p className="mt-3 text-xs text-cream-faint">
              {ORDER_POLICY.supportHours}
            </p>
          ) : null}
        </div>
      </section>

      {/* ---------- Stay in touch ---------- */}
      <section className="mx-auto w-full max-w-2xl px-5 pb-14 sm:px-8">
        <EmailCapture
          source="order-confirmed"
          title="Know before it sells out"
          blurb={`What's pressed each week, when the mango's back, and the odd thing we only make once. No more than one email a week.`}
          cta="Add me"
        />
      </section>

      <section className="mx-auto w-full max-w-2xl px-5 pb-24 text-center sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/menu" variant="primary" size="lg">
            Order again
          </ButtonLink>
          <ButtonLink href="/delivery" variant="secondary" size="lg">
            Delivery details
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

/**
 * The order, read back from Stripe. Line names come from the Checkout Session,
 * so a blend shows the name the customer gave it.
 */
function Receipt({ summary }: { summary: OrderSummary }) {
  const money = (pence: number | null) =>
    pence === null
      ? "—"
      : new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: summary.currency,
        }).format(pence / 100);

  return (
    <div className="border border-ink-line bg-ink-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink-line px-6 py-4">
        <p className="text-xs uppercase tracking-label text-cream-faint">
          Order reference
        </p>
        <p className="numeric text-sm text-cream">{summary.reference}</p>
      </div>

      <ul className="divide-y divide-ink-line px-6">
        {summary.items.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
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
              {money(item.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between gap-4 border-t border-ink-line px-6 py-4">
        <span className="text-xs uppercase tracking-label text-cream-faint">
          {summary.kind === "subscription" ? "Per week" : "Paid"}
        </span>
        <span className="numeric font-display text-2xl text-foil">
          {money(summary.total)}
        </span>
      </div>

      {summary.email || summary.postcode ? (
        <p className="border-t border-ink-line px-6 py-3.5 text-xs leading-relaxed text-cream-faint">
          {summary.email ? (
            <>
              Receipt sent to{" "}
              <span className="text-cream-dim">{summary.email}</span>.
            </>
          ) : null}
          {summary.postcode ? (
            <>
              {" "}
              Delivering to{" "}
              <span className="numeric text-cream-dim">
                {summary.postcode}
              </span>
              .
            </>
          ) : null}
        </p>
      ) : null}
    </div>
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
        <h3 className="mt-1 font-display text-lg text-cream">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-cream-dim">
          {children}
        </p>
      </div>
    </li>
  );
}
