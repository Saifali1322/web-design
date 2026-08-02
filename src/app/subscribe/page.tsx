import type { Metadata } from "next";
import Link from "next/link";
import {
  DELIVERY,
  formatPrice,
  SOCIALS,
  subscriptionTiers,
} from "@/lib/catalogue";
import PostcodeCheck from "@/components/subscribe/PostcodeCheck";
import SubscribePlans from "@/components/subscribe/SubscribePlans";

export const metadata: Metadata = {
  title: "Weekly Subscription",
  description:
    "Order once, delivered every Sunday. Juice Cartel's weekly subscription brings fresh juices, milkshakes and desserts to your door across Nottingham — swap flavours any week, skip when you're away, cancel anytime.",
};

/**
 * The subscription page.
 *
 * This is the business model, so the page is built around the two things that
 * stop people signing up for a recurring charge: not knowing exactly what will
 * happen, and not being sure they can stop. Every claim on it is either a fact
 * from the catalogue, a guarantee the owner has already published in the FAQ,
 * or a property of the checkout itself. Where a policy is needed and doesn't
 * exist yet — the exact skip cutoff, for instance — the page says what the
 * owner actually says and no more. See `src/app/order/policy.ts`.
 */

const promises = [
  "No minimum term",
  "Skip any week",
  "Cancel any time, no fee",
  `${DELIVERY.city} delivery included`,
];

const steps = [
  {
    n: "01",
    title: "Pick a tier",
    body: "Choose how much you want dropped each week — from a solo reset to a full household box.",
  },
  {
    n: "02",
    title: `We deliver, every ${DELIVERY.dropDay}`,
    body: `One press, one route. Everything lands on your doorstep across ${DELIVERY.city} on ${DELIVERY.dropDay}s, and we message you before we set off.`,
  },
  {
    n: "03",
    title: "Swap, skip or cancel",
    body: "Change your flavours, skip a week, or cancel outright, whenever it suits you. A message is all it takes, and a skipped week is not charged for.",
  },
];

const arrives = [
  {
    title: "Cold pressed that morning",
    body: "Nothing is made the night before. Everything on the van was pressed the same day it goes out.",
  },
  {
    title: "330ml bottles, your pick",
    body: "Choose from the whole juice menu. Tell us before the drop if you fancy something different that week.",
  },
  {
    title: "Keeps three days chilled",
    body: "Raw and unpasteurised, so it has the shelf life of real juice rather than the shelf life of a supermarket carton.",
  },
  {
    title: "One charge a week",
    body: "The price on the card is the whole price. No delivery charge is added on top of a subscription.",
  },
];

const commitments = [
  {
    title: "What you pay",
    body: "The weekly price shown, taken automatically once a week ahead of the drop, on the card you subscribe with. Stripe emails a receipt every time.",
  },
  {
    title: "How long you're tied in",
    body: "You aren't. There's no minimum term and no cancellation fee.",
  },
  {
    title: "How you stop it",
    body: "Message us, or use the link in your Stripe receipt, and it's off before your next payment.",
  },
  {
    title: "Who holds your card",
    body: "Stripe does. Card details never reach us, and we couldn't charge you off-schedule if we wanted to.",
  },
];

const faqs = [
  {
    q: "Can I swap flavours?",
    a: `Yes, any week. Message us on Instagram before ${DELIVERY.dropDay}'s drop with what you'd rather have and we'll swap it in — no extra charge, no admin.`,
  },
  {
    q: "How do I skip a week if I'm away?",
    /* This says the payment is paused, not just the delivery, because a
       weekly Stripe subscription bills on its own schedule whether or not a
       box goes out. Skipping therefore has to pause collection on the
       subscription as well — see docs/running-subscriptions.md. Promising a
       free skip while still taking the money is charging for nothing. */
    a: `Message us before the ${DELIVERY.dropDay} cutoff. We pause that week's drop and that week's payment, so you aren't charged for juice you didn't get, and it starts again the week after.`,
  },
  {
    q: "How do I cancel?",
    a: "Whenever you like, no minimum term and no cancellation fee. Message us on Instagram, or use the link in your confirmation email, and it's off before your next payment.",
  },
  {
    q: "When is payment taken?",
    a: `Automatically, once a week, using the card you subscribe with, ahead of the ${DELIVERY.dropDay} drop. You'll get a receipt every time.`,
  },
  {
    q: "What if I'm not in when you come?",
    a: "We message you before we set off, so reply there and tell us where to leave it or when you'll be back. It's one van and one driver — it's easy to sort.",
  },
  {
    q: "Do I have to subscribe to order?",
    a: "Not at all. Everything on the menu can be bought one-off, with the usual minimum order and delivery charge. The subscription is only cheaper if you'd be ordering anyway.",
  },
];

export default function SubscribePage() {
  return (
    <div className="bg-grain">
      {/* ---------- Hero ---------- */}
      <section className="mx-auto max-w-4xl px-5 pb-8 pt-14 text-center sm:px-8 sm:pt-20">
        <p className="tracking-label text-xs uppercase text-gold">
          The Weekly Drop
        </p>
        <h1 className="mt-3 font-display text-4xl text-foil sm:text-5xl">
          Order once. Never think about it again.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
          One order sets up a standing delivery, every {DELIVERY.dropDay},
          across {DELIVERY.city}. You choose the tier, we handle the pressing,
          the packing and the drop. Swap flavours whenever you like, skip a
          week if you&rsquo;re away, cancel outright if it&rsquo;s not for you —
          no contract, no penalty.
        </p>

        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {promises.map((promise) => (
            <li
              key={promise}
              className="border border-ink-line bg-ink-card px-3 py-1.5 text-[0.6875rem] uppercase tracking-label text-cream-dim"
            >
              {promise}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- How it works ---------- */}
      <section
        aria-labelledby="how-it-works"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2 id="how-it-works" className="sr-only">
          How the subscription works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="flex flex-col gap-2">
              <span className="numeric font-display text-3xl text-gold-deep">
                {step.n}
              </span>
              <h3 className="font-display text-lg text-cream">{step.title}</h3>
              <p className="text-sm leading-relaxed text-cream-dim">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="rule-foil" />
      </div>

      {/* ---------- Postcode first ---------- */}
      <section
        aria-labelledby="check-postcode"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2 id="check-postcode" className="mb-2 font-display text-xl text-cream">
          First — can we reach you?
        </h2>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-cream-dim">
          One van, one route, once a week. It&rsquo;s{" "}
          {DELIVERY.postcodes.length}{" "}
          outward codes for now, so it&rsquo;s worth thirty seconds before you
          pick a plan.
        </p>
        <PostcodeCheck />
      </section>

      {/* ---------- Tiers ---------- */}
      {/* max-w-5xl like every other section: three cards fit comfortably, and
          a single left edge down the page is most of what "considered" looks
          like. */}
      <section
        aria-labelledby="tiers"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2
          id="tiers"
          className="mb-8 font-display text-2xl text-foil sm:text-3xl"
        >
          Choose your tier
        </h2>
        <SubscribePlans />
        <p className="mt-6 text-xs leading-relaxed text-cream-faint">
          All juices are 330ml, pressed the morning they go out. Delivering to{" "}
          {DELIVERY.city} postcodes only —{" "}
          <Link
            href="/delivery"
            className="text-gold underline underline-offset-2"
          >
            check yours covers the route
          </Link>
          . Allergen information for every item is on the{" "}
          <Link
            href="/allergens"
            className="text-gold underline underline-offset-2"
          >
            allergens page
          </Link>
          .
        </p>
      </section>

      {/* ---------- What arrives ---------- */}
      <section
        aria-labelledby="arrives"
        className="mx-auto max-w-5xl px-5 py-14 sm:px-8"
      >
        <h2
          id="arrives"
          className="mb-2 font-display text-2xl text-foil sm:text-3xl"
        >
          What actually turns up
        </h2>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-cream-dim">
          No mystery box. You know what&rsquo;s coming, when it was made and
          how long it keeps.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {arrives.map((item) => (
            <div
              key={item.title}
              className="border border-ink-line bg-ink-card p-6"
            >
              <h3 className="font-display text-lg text-cream">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-dim">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Why it's cheaper ---------- */}
      <section
        aria-labelledby="savings"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2
          id="savings"
          className="mb-2 font-display text-2xl text-foil sm:text-3xl"
        >
          Why it costs less
        </h2>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-cream-dim">
          One press and one route on a {DELIVERY.dropDay} is far cheaper to run
          than the same bottles going out one at a time all week. That saving is
          the discount — there is no other trick to it.
        </p>

        {/* Wide content scrolls in its own box rather than pushing the page. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">
              Subscription prices compared with buying the same contents
              separately
            </caption>
            <thead>
              <tr className="border-b border-ink-line text-left">
                <th scope="col" className="py-3 pr-4 font-medium text-cream">
                  Plan
                </th>
                <th scope="col" className="py-3 pr-4 font-medium text-cream-dim">
                  One at a time
                </th>
                <th scope="col" className="py-3 pr-4 font-medium text-cream-dim">
                  Subscribed
                </th>
                <th scope="col" className="py-3 font-medium text-cream-dim">
                  You keep
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptionTiers.map((tier) => (
                <tr key={tier.id} className="border-b border-ink-line/70">
                  <th
                    scope="row"
                    className="py-4 pr-4 text-left font-normal text-cream"
                  >
                    {tier.name}
                    <span className="mt-0.5 block text-xs text-cream-faint">
                      {tier.contents}
                    </span>
                  </th>
                  <td className="numeric py-4 pr-4 text-cream-faint line-through">
                    {formatPrice(tier.listPrice)}
                  </td>
                  <td className="numeric py-4 pr-4 text-cream">
                    {formatPrice(tier.price)}
                  </td>
                  <td className="numeric py-4 text-fresh">
                    {formatPrice(tier.listPrice - tier.price)} / week
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-cream-faint">
          &ldquo;One at a time&rdquo; is the current menu price of the same
          contents bought individually. Prices in{" "}
          <Link href="/menu" className="text-gold underline underline-offset-2">
            the menu
          </Link>
          .
        </p>
      </section>

      {/* ---------- Reducing the risk ---------- */}
      <section
        aria-labelledby="commitment"
        className="mx-auto max-w-5xl px-5 py-14 sm:px-8"
      >
        <h2
          id="commitment"
          className="mb-2 font-display text-2xl text-foil sm:text-3xl"
        >
          What you&rsquo;re agreeing to
        </h2>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-cream-dim">
          A recurring charge deserves to be spelled out before you agree to it,
          not after.
        </p>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {commitments.map((item) => (
            <div key={item.title} className="border-l border-ink-line pl-5">
              <dt className="font-display text-lg text-cream">{item.title}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-cream-dim">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- FAQ ---------- */}
      {/* Section width matches the rest of the page so the left edge holds;
          the list inside keeps a 3xl measure, because a 1024px-wide line of
          body copy is a chore to read. */}
      <section
        aria-labelledby="faq"
        className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8"
      >
        <h2
          id="faq"
          className="mb-6 font-display text-2xl text-foil sm:text-3xl"
        >
          Questions, answered honestly
        </h2>
        <div className="flex max-w-3xl flex-col divide-y divide-ink-line border-y border-ink-line">
          {faqs.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-cream marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                <span className="font-medium">{item.q}</span>
                <span
                  aria-hidden="true"
                  className="text-gold transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-cream-dim">
                {item.a}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm text-cream-dim">
          Anything else, message{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2"
          >
            {SOCIALS.handle}
          </a>{" "}
          on Instagram or call{" "}
          <a
            href={`tel:${SOCIALS.phone}`}
            className="numeric text-gold underline underline-offset-2"
          >
            {SOCIALS.phone}
          </a>{" "}
          — a real person answers.
        </p>
      </section>
    </div>
  );
}
