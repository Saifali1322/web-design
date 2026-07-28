import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY, formatPrice } from "@/lib/catalogue";
import { BLEND_PREMIUM, MAX_COMPONENTS, MAX_PARTS } from "@/lib/blend";
import Mixer from "@/components/mixer/Mixer";

export const metadata: Metadata = {
  title: "Build Your Own Blend",
  description:
    "Mix your own cold pressed juice. Pick up to three from the Juice Cartel menu, set the parts, name it, and we press it to order for your Nottingham delivery.",
};

export default function MixerPage() {
  return (
    <div className="bg-grain">
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-8 sm:pt-20">
        <p className="tracking-label text-xs uppercase text-gold">
          Build Your Own Blend
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl text-foil sm:text-5xl">
          Make one that isn&rsquo;t on the menu
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
          Pick up to {MAX_COMPONENTS} juices, decide how much of each goes in,
          and we press it the morning it goes out. Parts, not percentages — one
          to {MAX_PARTS} of each — because somebody has to stand at the press
          and pour it.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream-dim">
          You pay the average of what&rsquo;s in it, weighted by parts, plus{" "}
          <span className="numeric">{formatPrice(BLEND_PREMIUM)}</span> because
          a bespoke bottle is pressed on its own rather than as part of a batch.
          The full sum is shown as you build it. Everything else is the same:
          minimum order{" "}
          <span className="numeric">{formatPrice(DELIVERY.minimumOrder)}</span>,
          free delivery over{" "}
          <span className="numeric">
            {formatPrice(DELIVERY.freeDeliveryThreshold)}
          </span>
          , delivered across {DELIVERY.city} every{" "}
          <Link
            href="/delivery"
            className="text-gold underline underline-offset-2"
          >
            {DELIVERY.dropDay}
          </Link>
          .
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="rule-foil" />
      </div>

      <section
        aria-label="Blend builder"
        className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:pb-24"
      >
        <Mixer />
      </section>
    </div>
  );
}
