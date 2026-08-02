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

/** The juices that are not one ingredient, named rather than glossed over. */
const BLENDED = juices.filter((juice) => juice.ingredients.length > 1);

/**
 * The lead point carries the argument; the two under it are the supporting
 * evidence. They were three equal columns, which is the shape a system reaches
 * for when it has three of something and no opinion about which matters most.
 */
const LEAD = {
  title: "Whole fruit, not concentrate",
  body: "Oranges, watermelons and pomegranates go through the press on the morning your order goes out. Nothing is reconstituted from a drum. Nothing is topped up with water or cheap apple juice to make it go further.",
};

const SUPPORT = [
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
    width: "sm:col-span-4",
  },
  {
    value: `${KEEPS} days`,
    label: "Shelf life, refrigerated, and that is the honest number",
    width: "sm:col-span-4",
  },
  {
    value: "0",
    label: "Preservatives, added sugar, added water or concentrate",
    width: "sm:col-span-3",
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

      {/* The heading lives in the wider shell and everything under it in the
          narrower one, so from 1280px up the title hangs a clear 64px into the
          left margin. Below that the two containers resolve to the same width
          and the hang closes itself, which is why it cannot push the page
          sideways at any viewport. */}
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <Reveal>
          <h2
            id="difference-heading"
            className="text-foil font-display text-3xl leading-[1.05] font-medium tracking-[0.06em] sm:text-4xl lg:text-5xl"
          >
            NOTHING WAS
            <br />
            DONE TO IT
          </h2>
        </Reveal>
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="mt-7 max-w-xl text-[0.9375rem] leading-relaxed font-light text-cream-dim lg:ml-auto lg:mt-8">
            Most chilled juice with a date three weeks out has been heated, or
            put under enough pressure to kill everything living in it, so it can
            survive a warehouse. That is a perfectly sensible way to run a drink
            company.{" "}
            <span className="text-cream">
              It is just a different product from this one.
            </span>{" "}
            Ours has {KEEPS}{" "}
            days on it because it went through a press and then straight into a
            bottle.
          </p>
        </Reveal>

        {/* 60/40, not thirds. The lead point is the argument; the two beside it
            are the evidence, and they are set smaller because that is what they
            are. */}
        <div className="mt-14 grid gap-x-16 gap-y-10 sm:mt-16 lg:grid-cols-[1.35fr_1fr]">
          <Reveal>
            <h3 className="font-display text-2xl leading-snug tracking-[0.02em] text-cream sm:text-[1.75rem]">
              {LEAD.title}
            </h3>
            <p className="mt-5 max-w-xl text-base leading-relaxed font-light text-cream-dim">
              {LEAD.body}
            </p>

            {/* A margin note, set where a margin note goes: hard against the
                left edge of the column, small, and too specific to have been
                generated. It is the footnote to the 6/7 in the strip below. */}
            {BLENDED.length > 0 && (
              <p className="mt-8 max-w-xs border-l border-gold-deep pl-4 text-sm leading-relaxed font-light text-cream-faint">
                {BLENDED.length === 1 ? "The odd one out is" : "The odd ones out are"}{" "}
                {BLENDED.map((j) => j.name).join(" and ")}. The second
                ingredient is{" "}
                {BLENDED[0].ingredients.slice(1).join(" and ").toLowerCase()},
                and that is the whole list.
              </p>
            )}
          </Reveal>

          <ul className="divide-y divide-ink-line border-t border-ink-line lg:mt-2">
            {SUPPORT.map((point, index) => (
              <Reveal as="li" key={point.title} delay={0.06 + index * 0.08}>
                <div className="py-6">
                  <h3 className="flex items-start gap-3 font-display text-lg leading-snug tracking-[0.02em] text-cream">
                    <span
                      aria-hidden="true"
                      className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"
                    />
                    {point.title}
                  </h3>
                  <p className="mt-2.5 pl-[1.125rem] text-sm leading-relaxed font-light text-cream-dim">
                    {point.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* The three claims above, restated as numbers anyone can check against
            the menu. Counted, not written. Eleven columns rather than twelve,
            so the three cells cannot land on a tidy third each. */}
        <Reveal delay={0.05}>
          <dl className="mt-16 grid gap-px border-y border-ink-line bg-ink-line sm:mt-20 sm:grid-cols-11">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className={`bg-ink-card px-6 py-8 sm:px-7 sm:py-10 ${stat.width}`}
              >
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
          <p className="mt-7 max-w-lg text-sm leading-relaxed font-light text-cream-faint lg:ml-auto lg:text-right">
            If it separates in the fridge that is the pulp settling out, not the
            juice turning. Give it a shake.{" "}
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
