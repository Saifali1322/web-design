import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY, SOCIALS, subscriptionTiers } from "@/lib/catalogue";
import TierCard from "@/components/subscribe/TierCard";
import PostcodeCheck from "@/components/subscribe/PostcodeCheck";

export const metadata: Metadata = {
  title: "Weekly Subscription",
  description:
    "Order once, delivered every Sunday. Juice Cartel's weekly subscription brings fresh juices, milkshakes and desserts to your door across Nottingham — swap flavours any week, cancel anytime.",
};

const steps = [
  {
    n: "01",
    title: "Pick a tier",
    body: "Choose how much you want dropped each week — from a solo reset to a full household box.",
  },
  {
    n: "02",
    title: "We deliver, every Sunday",
    body: `One press, one route. Everything lands on your doorstep across ${DELIVERY.city} on ${DELIVERY.dropDay}s.`,
  },
  {
    n: "03",
    title: "Swap, skip or cancel",
    body: "Change your flavours, skip a week, or cancel outright, whenever it suits you.",
  },
];

const faqs = [
  {
    q: "Can I swap flavours?",
    a: "Yes, any week. Message us on Instagram before Sunday's drop with what you'd rather have and we'll swap it in — no extra charge, no admin.",
  },
  {
    q: "How do I skip a week?",
    a: "Message us before the Sunday cutoff and we'll pause that week's drop. Your subscription picks straight back up the week after — nothing is lost.",
  },
  {
    q: "How do I cancel?",
    a: "Whenever you like, no minimum term and no cancellation fee. Message us on Instagram, or use the link in your confirmation email, and it's off before your next payment.",
  },
  {
    q: "When is payment taken?",
    a: "Automatically, once a week, using the card you subscribe with, ahead of the Sunday drop. You'll get a receipt every time.",
  },
];

export default function SubscribePage() {
  return (
    <div className="bg-grain">
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
          week if you're away, cancel outright if it's not for you — no
          contract, no penalty.
        </p>
      </section>

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

      <section
        aria-labelledby="check-postcode"
        className="mx-auto max-w-5xl px-5 py-10 sm:px-8"
      >
        <h2
          id="check-postcode"
          className="mb-4 font-display text-xl text-cream"
        >
          Before you subscribe
        </h2>
        <PostcodeCheck />
      </section>

      <section
        aria-labelledby="tiers"
        className="mx-auto max-w-6xl px-5 py-10 sm:px-8"
      >
        <h2 id="tiers" className="mb-8 font-display text-2xl text-foil sm:text-3xl">
          Choose your tier
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {subscriptionTiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
        <p className="mt-6 text-xs text-cream-faint">
          All juices are 330ml, pressed the morning they go out. Delivering
          to {DELIVERY.city} postcodes only —{" "}
          <Link href="/delivery" className="text-gold underline underline-offset-2">
            check yours covers the route
          </Link>
          .
        </p>
      </section>

      <section
        aria-labelledby="faq"
        className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8"
      >
        <h2 id="faq" className="mb-6 font-display text-2xl text-foil sm:text-3xl">
          Questions, answered honestly
        </h2>
        <div className="flex flex-col divide-y divide-ink-line border-y border-ink-line">
          {faqs.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-cream marker:content-none">
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
        <p className="mt-6 text-sm text-cream-dim">
          Anything else, message{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2"
          >
            {SOCIALS.handle}
          </a>{" "}
          on Instagram — a real person answers.
        </p>
      </section>
    </div>
  );
}
