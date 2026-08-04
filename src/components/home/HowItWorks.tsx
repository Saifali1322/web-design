import Reveal from "@/components/ui/Reveal";
import { DELIVERY, juices } from "@/lib/catalogue";

const KEEPS = Math.min(...juices.map((juice) => juice.keepsDays));

/**
 * Four steps, not three. The old sequence stopped at the doorstep, which left
 * the shelf life sitting in the small print. The shelf life is the whole
 * argument of the page above, so ending on it closes the loop: the three-day
 * date is the last step of the process rather than a caveat about it.
 */
const STEPS = [
  {
    title: "Order by Thursday",
    body: "Build a box any time before Thursday night, and swap flavours as often as you like until then. Nothing is fixed until the press list closes and the fruit gets bought against it.",
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
    body: `Keep it in the fridge and finish it within ${KEEPS} days. That is not caution. It is what raw juice with nothing added to it actually does.`,
  },
] as const;

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="relative border-t border-ink-line bg-ink-raised py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end lg:gap-16">
            <div>
              <p className="font-sans text-[0.6875rem] tracking-label text-cream-faint uppercase">
                Thursday to Sunday, every week
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
                It all happens in a day.
              </span>{" "}
              Nothing is pressed before the list closes and nothing is held back
              for the week after, which is why there is a deadline in the middle
              of it.
            </p>
          </div>
        </Reveal>

        <ol className="mt-14 grid gap-10 sm:mt-16 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-[1.2fr_1fr_0.95fr_0.95fr] lg:gap-0">
          {STEPS.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 0.09}
              className="relative border-l border-ink-line pl-7 lg:border-t lg:border-l-0 lg:px-7 lg:pt-8 lg:first:pl-0 lg:last:pr-0"
            >
              {/* The tick that sits on the rule. The rule itself turns from a
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
      </div>
    </section>
  );
}

export default HowItWorks;
