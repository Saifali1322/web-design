import { DELIVERY, juices } from "@/lib/catalogue";

/**
 * The three phrases are verbatim from the packaging and flyers. They are not
 * marketing copy to be rewritten. Treat them as fixed.
 */
const PHRASES = ["Fresh Ingredients", "Freshly Made", "Made With Love"] as const;

/** Repeated so the track fills a wide desktop viewport before it loops. */
const RUNS = 4;

/**
 * Shortest juice shelf life, read off the catalogue rather than typed here, so
 * a recipe change that shortens it can never leave a stale number on the page
 * directly under the words "freshly made".
 */
const JUICE_KEEPS = Math.min(...juices.map((juice) => juice.keepsDays));

/**
 * The marquee is atmosphere. On its own it is the first thing after the hero
 * and it asserts nothing a stranger can check, so four verifiable facts sit
 * underneath it. This is the "what it actually is" beat of the page, and it has
 * to carry weight rather than mood.
 */
const FACTS = [
  {
    value: "330ml",
    label: "Cold pressed",
    note: "Whole fruit through a press. Nothing reconstituted from a drum.",
  },
  {
    value: `${JUICE_KEEPS} days`,
    label: "How long it keeps",
    note: "Raw, unpasteurised, and with nothing in it to make it last longer.",
  },
  {
    value: DELIVERY.dropDay,
    label: "Pressed and delivered",
    note: "Made the same morning it reaches you. Not the week before.",
  },
  {
    value: DELIVERY.city,
    label: "Where we go",
    note: `${DELIVERY.postcodes.length} outward codes, covered in one afternoon.`,
  },
] as const;

function Run() {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: RUNS }).flatMap((_, run) =>
        PHRASES.map((phrase) => (
          <span key={`${run}-${phrase}`} className="flex items-center">
            <span className="px-6 font-sans text-[0.6875rem] tracking-label whitespace-nowrap text-gold uppercase sm:px-9 sm:text-xs">
              {phrase}
            </span>
            <span className="h-3 w-px shrink-0 bg-gold-deep/60" />
          </span>
        )),
      )}
    </div>
  );
}

export function TrustBar() {
  return (
    <section
      aria-label="What goes into every bottle"
      className="relative border-y border-ink-line bg-ink-raised"
    >
      <div className="border-b border-ink-line py-4 sm:py-5">
        {/* Said once for assistive tech; the visual track repeats itself. */}
        <p className="sr-only">
          Fresh ingredients. Freshly made. Made with love.
        </p>

        <div
          aria-hidden="true"
          className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
        >
          {/* The duplicate track is what makes the loop join up invisibly: the
              animation translates exactly -50%, so run two lands where run one
              started. Reduced motion parks it, and the mask softens the ends. */}
          <div className="animate-marquee flex w-max motion-reduce:animate-none">
            <Run />
            <Run />
          </div>
        </div>
      </div>

      {/* gap-px over the line colour draws the hairline grid without four
          separate border rules that would double up at the joins.

          The cell padding matches the page gutter (px-5 / sm:px-8) rather than
          being chosen for the cell, so the first fact's text sits on the same
          left edge as every section below it instead of eight pixels off.

          Four across only from lg. On a tablet that would leave 128px of text
          width per cell once the gutters are taken off, and every note would
          break into four ragged lines. */}
      <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-ink-line lg:grid-cols-4">
        {FACTS.map((fact) => (
          <div key={fact.label} className="bg-ink-raised px-5 py-7 sm:px-8 sm:py-9">
            <dt className="font-sans text-[0.5625rem] tracking-label text-cream-faint uppercase sm:text-[0.625rem]">
              {fact.label}
            </dt>
            <dd>
              <span className="numeric text-foil mt-2.5 block font-display text-xl leading-none font-medium sm:text-2xl">
                {fact.value}
              </span>
              <span className="mt-2.5 block text-[0.8125rem] leading-relaxed font-light text-cream-dim">
                {fact.note}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default TrustBar;
