import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { DELIVERY, formatPrice } from "@/lib/catalogue";

export function DeliveryStrip() {
  const facts = [
    { label: "Minimum order", value: formatPrice(DELIVERY.minimumOrder) },
    {
      label: "Free delivery over",
      value: formatPrice(DELIVERY.freeDeliveryThreshold),
    },
    { label: "Otherwise", value: formatPrice(DELIVERY.deliveryFee) },
    { label: "Drop day", value: DELIVERY.dropDay },
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
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
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
              {DELIVERY.city} only, for now. If your outward code is on this
              list we are already on your street every {DELIVERY.dropDay} — and
              if it isn&rsquo;t, message us and it goes on the list of places we
              are trying to reach next.
            </p>

            <ButtonLink
              href="/menu"
              variant="secondary"
              size="md"
              className="mt-8"
            >
              Start an order
            </ButtonLink>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="font-sans text-[0.625rem] tracking-label text-cream-faint uppercase">
              Postcodes on the route
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {DELIVERY.postcodes.map((postcode) => (
                <li key={postcode}>
                  <span className="numeric inline-flex h-9 items-center rounded-[2px] border border-gold-deep/45 px-3 font-sans text-xs tracking-[0.12em] text-gold uppercase">
                    {postcode}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-ink-line pt-8 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-sans text-[0.5625rem] tracking-label text-cream-faint uppercase sm:text-[0.625rem]">
                    {fact.label}
                  </dt>
                  <dd className="numeric mt-2 font-display text-xl leading-none text-gold sm:text-2xl">
                    {fact.value}
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
