import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { DELIVERY, formatPrice } from "@/lib/catalogue";

/**
 * The closing beat. Where it goes, what it costs to get it there, and the two
 * ways to start. It is the last section on the page, so it carries the primary
 * call to action rather than another link into the middle of the site.
 */
export function DeliveryStrip() {
  const facts = [
    {
      label: "Minimum order",
      value: formatPrice(DELIVERY.minimumOrder),
      note: "Below this a run loses money on fuel.",
    },
    {
      label: "Free delivery over",
      value: formatPrice(DELIVERY.freeDeliveryThreshold),
      note: "Roughly a four-bottle box.",
    },
    {
      label: "Otherwise",
      value: formatPrice(DELIVERY.deliveryFee),
      note: "Flat, whatever is in the bag.",
    },
    {
      label: "Drop day",
      value: DELIVERY.dropDay,
      note: "Afternoon, in one run.",
    },
  ];

  return (
    <section
      aria-labelledby="delivery-heading"
      className="relative isolate overflow-hidden border-t border-ink-line bg-ink-raised py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_85%_100%,rgba(212,166,60,0.12),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
              <span className="h-px w-8 bg-gold/60" />
              The route
            </p>

            <h2
              id="delivery-heading"
              className="text-foil mt-4 font-display text-2xl leading-tight font-medium tracking-[0.06em] sm:text-3xl lg:text-4xl"
            >
              WE DELIVER ACROSS {DELIVERY.city.toUpperCase()}
            </h2>

            <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed font-light text-cream-dim">
              {DELIVERY.city} only, for now, straight from the cold box to
              your door every {DELIVERY.dropDay} afternoon. Outside the
              route,{" "}
              <Link
                href="/delivery"
                className="text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
              >
                collection can be arranged
              </Link>
              .
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/menu" variant="primary" size="lg">
                Start an order
              </ButtonLink>
              <ButtonLink href="/faq" variant="secondary" size="lg">
                Read the FAQ
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            {/* Hand-set: the count as a display figure with the words hung off
                its baseline, rather than another tracked-out label. */}
            <div className="flex items-baseline gap-4">
              <span className="numeric font-display text-5xl leading-none text-gold-bright sm:text-6xl">
                {DELIVERY.postcodes.length}
              </span>
              <p className="font-sans text-[0.625rem] leading-[1.5] tracking-label text-cream-faint uppercase">
                outward codes
                <br />
                on the route
              </p>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2">
              {DELIVERY.postcodes.map((postcode) => (
                <li key={postcode}>
                  <span className="numeric inline-flex h-9 items-center rounded-[2px] border border-gold-deep/45 px-3 font-sans text-xs tracking-[0.12em] text-gold uppercase">
                    {postcode}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-ink-line pt-8 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  {/* "Free delivery over" wraps to two lines at this column
                      width while its neighbours do not, which drops its number
                      out of line with the rest of the row. Reserving two lines
                      keeps the four figures on one baseline. */}
                  <dt className="font-sans text-[0.5625rem] tracking-label text-cream-faint uppercase sm:min-h-[1.9rem] sm:text-[0.625rem]">
                    {fact.label}
                  </dt>
                  <dd>
                    <span className="numeric mt-2 block font-display text-xl leading-none text-gold sm:text-2xl">
                      {fact.value}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed font-light text-cream-faint">
                      {fact.note}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default DeliveryStrip;
