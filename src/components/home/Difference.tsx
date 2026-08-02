import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { juices } from "@/lib/catalogue";

/**
 * The "why it is different" beat.
 *
 * The rest of the page can only say the juice is good. This section is the one
 * place that says *why* it costs more than a supermarket bottle and why it only
 * lasts three days, because those are the two objections that stop a first
 * order. Both answers are the same fact, so it is argued once, properly.
 *
 * Every number here is counted off the catalogue rather than written down, so
 * adding a two-ingredient juice can never leave the page overclaiming.
 */
const SINGLE_INGREDIENT = juices.filter(
  (juice) => juice.ingredients.length === 1,
).length;

const KEEPS = Math.min(...juices.map((juice) => juice.keepsDays));

const POINTS = [
  {
    title: "Whole fruit, not concentrate",
    body: "Oranges, watermelons and pomegranates go through the press the morning your order goes out. Nothing is reconstituted from a drum, and nothing is topped up with water or cheap apple juice to make it go further.",
  },
  {
    title: "No heat, no high pressure",
    body: "Juice that keeps for a month has been pasteurised or put under high pressure. Both are done to make it last, and both change what ends up in the bottle. We would rather do neither and accept that it has to be drunk this week.",
  },
  {
    title: "Nothing added at all",
    body: `${SINGLE_INGREDIENT} of the ${juices.length} juices have exactly one ingredient on the list. No sugar, no water, no preservative, no stabiliser, nothing to stop the colour going.`,
  },
] as const;

const STATS = [
  {
    value: `${SINGLE_INGREDIENT}/${juices.length}`,
    label: "Juices made from a single ingredient",
  },
  {
    value: `${KEEPS} days`,
    label: "Shelf life, refrigerated, and that is the honest number",
  },
  {
    value: "0",
    label: "Preservatives, added sugar, added water or concentrate",
  },
] as const;

export function Difference() {
  return (
    <section
      aria-labelledby="difference-heading"
      className="relative isolate overflow-hidden border-t border-ink-line py-20 sm:py-28 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_65%_50%_at_80%_0%,rgba(212,166,60,0.10),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-16">
            <div>
              <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
                <span className="h-px w-8 bg-gold/60" />
                The difference
              </p>
              <h2
                id="difference-heading"
                className="text-foil mt-4 font-display text-3xl leading-[1.05] font-medium tracking-[0.06em] sm:text-4xl lg:text-5xl"
              >
                NOTHING WAS
                <br />
                DONE TO IT
              </h2>
            </div>

            <p className="max-w-xl text-[0.9375rem] leading-relaxed font-light text-cream-dim lg:pb-2">
              Most chilled juice with a date three weeks out has been heated, or
              put under enough pressure to kill everything living in it, so it
              can survive a warehouse. That is a perfectly sensible way to run a
              drink company.{" "}
              <span className="text-cream">
                It is just a different product from this one.
              </span>{" "}
              Ours has {KEEPS} days on it because it went through a press and
              then straight into a bottle.
            </p>
          </div>
        </Reveal>

        <div className="rule-foil mt-10 mb-12 sm:mt-12 sm:mb-14" />

        <ul className="grid gap-10 sm:gap-12 lg:grid-cols-3 lg:gap-14">
          {POINTS.map((point, index) => (
            <Reveal as="li" key={point.title} delay={index * 0.09}>
              <h3 className="flex items-start gap-3 font-display text-xl leading-snug tracking-[0.02em] text-cream sm:text-[1.375rem]">
                <span
                  aria-hidden="true"
                  className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"
                />
                {point.title}
              </h3>
              <p className="mt-4 pl-[1.125rem] text-sm leading-relaxed font-light text-cream-dim">
                {point.body}
              </p>
            </Reveal>
          ))}
        </ul>

        {/* The three claims above, restated as numbers anyone can check against
            the menu. Counted, not written — see the constants at the top. */}
        <Reveal delay={0.05}>
          <dl className="mt-16 grid gap-px border border-ink-line bg-ink-line sm:mt-20 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-ink-card px-6 py-8 sm:px-7 sm:py-10">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="numeric text-foil block font-display text-4xl leading-none font-medium sm:text-[2.75rem]">
                    {stat.value}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-4 block max-w-[22ch] text-[0.8125rem] leading-relaxed font-light text-cream-dim"
                  >
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.08}>
          {/* max-w-3xl, not 2xl: at the narrower measure the trailing link
              broke across two lines mid-phrase. */}
          <p className="mt-8 max-w-3xl text-sm leading-relaxed font-light text-cream-faint">
            If it separates in the fridge, that is the pulp settling out — not
            the juice turning. Give it a shake.{" "}
            <Link
              href="/faq#juice"
              className="text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
            >
              More on how it behaves
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default Difference;
