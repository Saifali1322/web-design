import { formatPrice, type SubscriptionTier } from "@/lib/catalogue";
import SubscribeButton from "./SubscribeButton";

export default function TierCard({ tier }: { tier: SubscriptionTier }) {
  const weeklySaving = tier.listPrice - tier.price;

  return (
    <div
      className={`relative flex flex-col gap-5 border p-6 sm:p-8 ${
        tier.bestValue
          ? "border-gold bg-ink-card shadow-[var(--shadow-gold)]"
          : "border-ink-line bg-ink-card"
      }`}
    >
      {tier.bestValue && (
        <span className="numeric absolute -top-3 left-6 border border-gold bg-ink px-3 py-1 text-[0.62rem] font-medium uppercase tracking-label text-gold-bright">
          Best Value
        </span>
      )}

      <div>
        <h3 className="font-display text-2xl text-foil">{tier.name}</h3>
        <p className="mt-1 text-sm text-cream-dim">{tier.contents}</p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="numeric font-display text-4xl text-gold-bright">
          {formatPrice(tier.price)}
        </span>
        <span className="text-xs uppercase tracking-label text-cream-faint">
          / week
        </span>
      </div>

      {weeklySaving > 0 && (
        <p className="numeric text-sm text-fresh">
          Save {formatPrice(weeklySaving)} a week vs buying separately
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
        <SubscribeButton tierId={tier.id} price={tier.price} />
      </div>
    </div>
  );
}
