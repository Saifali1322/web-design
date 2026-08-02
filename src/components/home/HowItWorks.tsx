import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { DELIVERY, juices } from "@/lib/catalogue";

const KEEPS = Math.min(...juices.map((juice) => juice.keepsDays));

/**
 * Four steps, not three. The old sequence stopped at the doorstep, which left
 * the shelf life to be discovered in the small print — and the shelf life is
 * the whole argument of the page above. Ending on it closes the loop: the
 * three-day date is presented as the last step of the process rather than a
 * caveat about it.
 */
const STEPS = [
  {
    title: "Order by Thursday",
    body: "Build a box any time before Thursday night. Swap flavours as often as you like until then — nothing is fixed until the press list closes and the fruit gets bought against it.",
  },
  {
    title: `Pressed ${DELIVERY.dropDay} morning`,
    body: "Fruit in early. Bottles filled from the jug, capped and labelled by hand, straight into the cold box. Everything on the list is made that morning and nothing is pressed ahead.",
  },
  {
    title: "Delivered the same day",
    body: `One route, one afternoon, across ${DELIVERY.city}. It travels in a cool bag with ice packs, and we message before setting off so you know roughly when to expect it.`,
  },
  {
    title: `Drunk inside ${KEEPS} days`,
    body: `Keep it in the fridge and finish it within ${KEEPS} days. That is not caution — it is what raw juice with nothing added to it actually does.`,
  },
] as const;

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="relative border-t border-ink-line bg-ink-raised py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end lg:gap-16">
            <div>
              <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
                <span className="h-px w-8 bg-gold/60" />
                The routine
              </p>
              <h2
                id="how-heading"
                className="text-foil mt-4 font-display text-3xl leading-none font-medium tracking-[0.06em] sm:text-4xl lg:text-5xl"
              >
                HOW IT WORKS
              </h2>
            </div>
            <p className="max-w-md text-[0.9375rem] leading-relaxed font-light text-cream-dim lg:pb-1">
              <span className="font-script text-2xl text-gold/90">
                One press, one route.
              </span>{" "}
              Everything is made on the same morning it goes out, which is why
              the week has a deadline in it.
            </p>
          </div>
        </Reveal>

        <ol className="mt-14 grid gap-10 sm:mt-16 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-4 lg:gap-0">
          {STEPS.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 0.09}
              className="relative border-l border-ink-line pl-7 lg:border-t lg:border-l-0 lg:px-7 lg:pt-8 lg:first:pl-0 lg:last:pr-0"
            >
              {/* The tick that sits on the rule — the rule turns from a
                  vertical spine on phones into a horizontal one on desktop. */}
              <span
                aria-hidden="true"
                className="absolute top-2 -left-[3.5px] h-1.5 w-1.5 rotate-45 bg-gold lg:top-[-3.5px] lg:left-0"
              />

              <p className="text-foil numeric font-display text-3xl leading-none font-medium tracking-[0.08em] sm:text-4xl">
                {String(index + 1).padStart(2, "0")}
              </p>

              <h3 className="mt-4 font-display text-xl leading-snug tracking-[0.02em] text-cream sm:text-[1.375rem]">
                {step.title}
              </h3>

              <p className="mt-3 max-w-sm text-sm leading-relaxed font-light text-cream-dim">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>

        {/* The deadline is the single most-questioned rule on the site, so it
            gets explained here rather than defended in a support message. */}
        <Reveal delay={0.05}>
          <div className="mt-14 grid gap-6 border-t border-ink-line pt-8 sm:mt-16 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
            <p className="max-w-2xl text-sm leading-relaxed font-light text-cream-dim">
              <span className="text-cream">
                The Thursday deadline is the reason the juice is any good.
              </span>{" "}
              If orders could land on Saturday night we would have to press
              against a guess, and pressing against a guess means bottles
              sitting in a fridge hoping somebody wants them. Knowing the number
              first is what keeps the fruit fresh and the waste at nothing.
            </p>

            <Link
              href="/faq#ordering"
              className="inline-flex items-center gap-2 font-sans text-[0.6875rem] tracking-label text-gold uppercase transition-colors hover:text-gold-bright"
            >
              Ordering, answered
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default HowItWorks;
