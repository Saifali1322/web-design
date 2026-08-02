import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY, formatPrice } from "@/lib/catalogue";
import {
  BLEND_PREMIUM,
  MAX_COMPONENTS,
  MAX_PARTS,
  MIN_PARTS,
} from "@/lib/blend";
import Mixer from "@/components/mixer/Mixer";

export const metadata: Metadata = {
  title: "Build Your Own Blend",
  description:
    "Mix your own cold pressed juice. Pick up to three from the Juice Cartel menu, set the parts, name it, and we press it to order for your Nottingham delivery.",
};

/**
 * The rules of a blend, as a spec list rather than a paragraph.
 *
 * They were three sentences with six numbers buried in them, which is the
 * hardest possible way to answer "what am I allowed to do here". Somebody
 * about to build something wants the constraints in a column they can scan.
 */
const RULES: { label: string; value: string; note?: string }[] = [
  {
    label: "Juices in a blend",
    value: `Up to ${MAX_COMPONENTS}`,
  },
  {
    label: "Parts of each",
    value: `${MIN_PARTS} to ${MAX_PARTS}`,
    note: "Parts, not percentages. Somebody has to stand at the press and pour it.",
  },
  {
    label: "Bespoke charge",
    value: `+${formatPrice(BLEND_PREMIUM)}`,
    note: "It is pressed on its own rather than as part of a batch.",
  },
  {
    label: "Minimum order",
    value: formatPrice(DELIVERY.minimumOrder),
  },
];

export default function MixerPage() {
  return (
    <div className="bg-grain">
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-8 sm:px-8 sm:pt-20">
        <div className="grid gap-x-16 gap-y-9 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="tracking-label text-xs uppercase text-gold">
              Build your own blend
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl text-foil sm:text-5xl">
              Make one that isn&rsquo;t on the menu
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-cream-dim sm:text-base">
              Pick your juices, decide how much of each goes in, give it a name,
              and we press it on the morning it goes out. You pay the average of
              what is in it, weighted by parts. The full sum is on screen as you
              build it, so nothing about the price is a surprise at the end.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream-faint">
              Everything else is the same as the rest of the menu: free delivery
              over {formatPrice(DELIVERY.freeDeliveryThreshold)}, and it goes out
              across {DELIVERY.city} every{" "}
              <Link
                href="/delivery"
                className="text-gold underline underline-offset-2"
              >
                {DELIVERY.dropDay}
              </Link>
              .
            </p>
          </div>

          <dl className="divide-y divide-ink-line border-y border-ink-line lg:mt-2">
            {RULES.map((rule) => (
              <div key={rule.label} className="py-4">
                <div className="flex items-baseline justify-between gap-5">
                  <dt className="text-[0.625rem] uppercase tracking-label text-cream-faint">
                    {rule.label}
                  </dt>
                  <dd className="numeric shrink-0 font-display text-lg leading-none text-gold-bright">
                    {rule.value}
                  </dd>
                </div>
                {rule.note && (
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-cream-faint">
                    {rule.note}
                  </p>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        aria-label="Blend builder"
        className="mx-auto max-w-6xl px-5 pt-6 pb-10 sm:px-8 lg:pb-24"
      >
        <Mixer />
      </section>
    </div>
  );
}
