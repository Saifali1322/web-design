"use client";

import { formatPrice, type SubscriptionTier } from "@/lib/catalogue";
import SubscribeButton from "@/components/subscribe/SubscribeButton";

/**
 * One weekly plan.
 *
 * The saving is stated three ways — the crossed-out list price, the amount
 * saved per week, and the same figure over a year — because "£1.99 a week"
 * and "£103 a year" persuade completely different people. All three come off
 * `listPrice` in the catalogue, which is the real cost of the same contents
 * bought one at a time; nothing here is invented.
 */
export default function TierCard({
  tier,
  configured,
}: {
  tier: SubscriptionTier;
  /** Null while the page is still asking whether subscriptions are live. */
  configured: boolean | null;
}) {
  const weeklySaving = tier.listPrice - tier.price;
  const percent = Math.round((weeklySaving / tier.listPrice) * 100);
  const yearlySaving = weeklySaving * 52;

  return (
    <div
      className={`relative flex flex-col gap-5 border p-6 transition-colors duration-500 sm:p-8 ${
        tier.bestValue
          ? "border-gold bg-ink-card shadow-[var(--shadow-gold)]"
          : "border-ink-line bg-ink-card hover:border-gold-deep/70"
      }`}
    >
      {tier.bestValue && (
        <span className="numeric absolute -top-3 left-6 border border-gold bg-ink px-3 py-1 text-[0.62rem] font-medium uppercase tracking-label text-gold-bright">
          Most popular
        </span>
      )}

      <div>
        <h3 className="font-display text-2xl text-foil">{tier.name}</h3>
        <p className="mt-1 text-sm text-cream-dim">{tier.contents}</p>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="numeric font-display text-4xl text-gold-bright">
            {formatPrice(tier.price)}
          </span>
          <span className="text-xs uppercase tracking-label text-cream-faint">
            / week
          </span>
        </div>

        {weeklySaving > 0 && (
          <p className="mt-2 text-sm text-cream-dim">
            <span className="numeric line-through decoration-cream-faint/70">
              {formatPrice(tier.listPrice)}
            </span>{" "}
            bought separately —{" "}
            <span className="numeric text-fresh">
              save {formatPrice(weeklySaving)} ({percent}%)
            </span>
          </p>
        )}
      </div>

      {weeklySaving > 0 && (
        <p className="numeric border-l-2 border-fresh/50 bg-fresh/[0.05] py-2 pl-3 text-xs leading-relaxed text-cream-dim">
          {formatPrice(yearlySaving)} a year if you keep it — and one charge a
          week, with nothing added at checkout.
        </p>
      )}

      <p className="text-sm leading-relaxed text-cream-dim">{tier.blurb}</p>

      <ul className="flex flex-col gap-2.5 border-t border-ink-line pt-5">
        {tier.includes.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-cream">
            <span aria-hidden="true" className="mt-0.5 text-gold">
              ✦
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        <SubscribeButton
          tierId={tier.id}
          tierName={tier.name}
          price={tier.price}
          configured={configured}
        />
      </div>
    </div>
  );
}
