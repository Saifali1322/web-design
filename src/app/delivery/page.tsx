import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY, SOCIALS, formatPrice } from "@/lib/catalogue";
import PostcodeCheck from "@/components/subscribe/PostcodeCheck";

export const metadata: Metadata = {
  title: "Delivery",
  description: `Juice Cartel delivers across ${DELIVERY.city} every ${DELIVERY.dropDay}. Check your postcode in one second, see the minimum order and free delivery threshold, or arrange collection.`,
};

/**
 * Delivery, and the postcode question.
 *
 * Eleven outward codes is a small route, so this page leads with the checker
 * rather than burying it under three sections of copy: the single most useful
 * thing it can do for a stranger is tell them, immediately, whether the rest
 * of the site is relevant to them. Everything else on the page is the answer
 * to "yes, and then what" or "no, so what now".
 */

const facts = [
  {
    label: "Delivery day",
    value: DELIVERY.dropDay,
    note: "One route, once a week — it keeps everything genuinely fresh.",
  },
  {
    label: "Minimum order",
    value: formatPrice(DELIVERY.minimumOrder),
    note: "Below this we'd be losing money on fuel alone, so we can't take it.",
  },
  {
    label: "Free delivery",
    value: `Over ${formatPrice(DELIVERY.freeDeliveryThreshold)}`,
    note: `Under that, delivery is a flat ${formatPrice(DELIVERY.deliveryFee)}.`,
  },
];

export default function DeliveryPage() {
  return (
    <div className="bg-grain">
      <section className="mx-auto max-w-4xl px-5 pb-8 pt-14 text-center sm:px-8 sm:pt-20">
        <p className="tracking-label text-xs uppercase text-gold">Delivery</p>
        <h1 className="mt-3 font-display text-4xl text-foil sm:text-5xl">
          Across {DELIVERY.city}, every {DELIVERY.dropDay}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
          One driver, one route, once a week — it&rsquo;s how everything stays
          fresh and the price stays fair. That does mean the map is small, so
          the first thing worth doing is checking whether we reach you.
        </p>
      </section>

      {/* ---------- The check, front and centre ---------- */}
      <section
        aria-labelledby="postcode-check"
        className="mx-auto max-w-3xl px-5 pb-6 pt-4 sm:px-8"
      >
        <div className="border border-gold-dim/50 bg-ink-card p-6 sm:p-8">
          <h2
            id="postcode-check"
            className="font-display text-2xl text-foil sm:text-3xl"
          >
            Do we reach you?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream-dim">
            Type your postcode — the first part is enough. We&rsquo;ll remember
            it for the basket, so you only ever do this once.
          </p>
          <PostcodeCheck className="mt-6" />
        </div>
      </section>

      <section
        aria-labelledby="how-it-works"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2 id="how-it-works" className="sr-only">
          How delivery works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="border border-ink-line bg-ink-card p-6"
            >
              <p className="text-xs uppercase tracking-label text-cream-faint">
                {fact.label}
              </p>
              <p className="numeric mt-2 font-display text-2xl text-gold-bright">
                {fact.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cream-dim">
                {fact.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="areas"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2
          id="areas"
          className="mb-2 font-display text-2xl text-foil sm:text-3xl"
        >
          The {DELIVERY.postcodes.length} codes on the route
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-cream-dim">
          These are the outward codes we currently reach. Match the first part
          of your postcode against the list — if it&rsquo;s here, you&rsquo;re
          in.
        </p>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {DELIVERY.postcodes.map((code) => (
            <li key={code}>
              <span className="numeric flex items-center justify-center border border-gold-dim/50 bg-ink-card py-3 text-sm font-medium tracking-widest text-gold-bright">
                {code}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="collection"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2
          id="collection"
          className="mb-2 font-display text-2xl text-foil sm:text-3xl"
        >
          Outside the route? Collection still works
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-cream-dim">
          Outside the delivery postcodes, or just passing through{" "}
          {DELIVERY.city}? Message us on{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2"
          >
            Instagram
          </a>{" "}
          ahead of {DELIVERY.dropDay}{" "}
          and we&rsquo;ll arrange a collection time and place near our kitchen —
          no minimum order applies to collections.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-dim">
          Or call{" "}
          <a
            href={`tel:${SOCIALS.phone}`}
            className="numeric text-gold underline underline-offset-2"
          >
            {SOCIALS.phone}
          </a>{" "}
          if it&rsquo;s easier to say out loud.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8">
        <div className="rule-foil mb-8" />
        <p className="max-w-2xl text-sm leading-relaxed text-cream-dim">
          Ordering something with allergies in mind? Read the{" "}
          <Link
            href="/allergens"
            className="text-gold underline underline-offset-2"
          >
            full allergen matrix
          </Link>{" "}
          before you order, or head to the{" "}
          <Link
            href="/subscribe"
            className="text-gold underline underline-offset-2"
          >
            weekly subscription
          </Link>{" "}
          if you&rsquo;d rather it just turned up every {DELIVERY.dropDay}.
        </p>
      </section>
    </div>
  );
}
