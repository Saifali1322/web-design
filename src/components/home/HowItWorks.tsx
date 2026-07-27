import Reveal from "@/components/ui/Reveal";
import { DELIVERY } from "@/lib/catalogue";

/**
 * A real three-step sequence — order, press, deliver — so the numbering is
 * doing work rather than decorating three unrelated selling points.
 */
const STEPS = [
  {
    title: "Order by Thursday",
    body: "Build your box any time before Thursday night. Swap flavours as often as you like until then — nothing is fixed until the press list goes out.",
  },
  {
    title: `We press ${DELIVERY.dropDay} morning`,
    body: "Everything is made the morning it leaves. Fruit in at six, bottles capped and labelled by ten, straight into the cold box.",
  },
  {
    title: "Delivered to your door",
    body: `One route, one afternoon. Your box lands ${DELIVERY.dropDay} across ${DELIVERY.city}, still cold, ready for the week ahead.`,
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
              We make everything on the same morning it goes out, which is why
              the week has a deadline in it.
            </p>
          </div>
        </Reveal>

        <ol className="mt-14 grid gap-10 sm:mt-16 sm:gap-12 lg:grid-cols-3 lg:gap-0">
          {STEPS.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 0.1}
              className="relative border-l border-ink-line pl-7 lg:border-t lg:border-l-0 lg:px-8 lg:pt-8 lg:first:pl-0 lg:last:pr-0"
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

              <h3 className="mt-4 font-display text-xl leading-snug tracking-[0.02em] text-cream sm:text-2xl">
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
