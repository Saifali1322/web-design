import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { DELIVERY, formatPrice, subscriptionTiers } from "@/lib/catalogue";

/** Largest weekly saving on the board, used to headline the price argument. */
const BEST_SAVING = Math.max(
  ...subscriptionTiers.map((tier) => tier.listPrice - tier.price),
);

export function SubscriptionTeaser() {
  return (
    <section
      aria-labelledby="subscribe-heading"
      className="relative isolate overflow-hidden border-t border-ink-line py-24 sm:py-32 lg:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_15%_0%,rgba(212,166,60,0.14),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* ---------- the pitch ---------- */}
          <Reveal>
            <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
              <span className="h-px w-8 bg-gold/60" />
              The weekly drop
            </p>

            <h2 id="subscribe-heading" className="mt-4">
              <span className="text-foil block font-script text-4xl leading-[1.05] sm:text-5xl">
                Every {DELIVERY.dropDay},
              </span>
              <span className="text-foil mt-1 block font-display text-2xl leading-none font-medium tracking-[0.08em] sm:text-3xl lg:text-4xl">
                WITHOUT ASKING
              </span>
            </h2>

            <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed font-light text-cream-dim">
              Pick a size, pick your flavours, and the same box turns up every{" "}
              {DELIVERY.dropDay} for up to {formatPrice(BEST_SAVING)} a week
              less than buying it bottle by bottle.
            </p>

            {/* The discount is the obvious question, and the honest answer is
                an operational one rather than a marketing one. Saying where the
                money comes from is more persuasive than the number itself. */}
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed font-light text-cream-dim">
              <span className="text-cream">
                That saving is not a discount we swallow.
              </span>{" "}
              Knowing exactly how many bottles are going out before the fruit
              gets bought means nothing is pressed on spec and nothing goes in
              the bin. The box costs less to make. That is the entire reason it
              costs less to buy.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                `Free delivery across ${DELIVERY.city}, every week`,
                "Change flavours any week, up to Thursday",
                "Skip a week if you are away, and skip the payment with it",
                "No contract, no notice period, no cancellation fee",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm font-light text-cream-dim"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.4rem] h-1 w-1 shrink-0 rotate-45 bg-gold"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <ButtonLink
              href="/subscribe"
              variant="primary"
              size="lg"
              className="mt-9"
            >
              See the weekly drop
            </ButtonLink>
          </Reveal>

          {/* ---------- the tiers ---------- */}
          <div>
            <ul className="flex flex-col gap-3 sm:gap-4">
              {subscriptionTiers.map((tier, index) => {
                const saving = tier.listPrice - tier.price;

                return (
                  <Reveal as="li" key={tier.id} delay={index * 0.08}>
                    <Link
                      href="/subscribe"
                      className={`group relative flex flex-col gap-5 rounded-[2px] border bg-ink-card p-5 transition-colors duration-500 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6 ${
                        tier.bestValue
                          ? "border-gold-deep/80 hover:border-gold"
                          : "border-ink-line hover:border-gold-deep/70"
                      }`}
                    >
                      {tier.bestValue && (
                        <span className="absolute -top-2 left-5 bg-ink px-2 font-sans text-[0.5625rem] tracking-label text-gold-bright uppercase sm:left-6">
                          Most popular
                        </span>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-display text-xl leading-tight tracking-[0.02em] text-cream transition-colors group-hover:text-gold-bright">
                          {tier.name}
                        </h3>
                        <p className="mt-1.5 text-sm font-light text-cream-dim">
                          {tier.contents}
                        </p>
                      </div>

                      <div className="flex items-end justify-between gap-6 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
                        <p className="flex items-baseline gap-1.5">
                          <span className="numeric font-display text-2xl leading-none text-gold sm:text-3xl">
                            {formatPrice(tier.price)}
                          </span>
                          <span className="font-sans text-[0.625rem] tracking-[0.14em] text-cream-faint uppercase">
                            / week
                          </span>
                        </p>
                        {/* Honest maths: the same contents bought one-off. */}
                        <p className="numeric font-sans text-[0.625rem] tracking-[0.12em] whitespace-nowrap text-cream-faint uppercase">
                          <span className="sr-only">Normally </span>
                          <s className="text-cream-faint/70">
                            {formatPrice(tier.listPrice)}
                          </s>{" "}
                          <span className="text-gold/85">
                            save {formatPrice(saving)}
                          </span>
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>

            <Reveal delay={0.12}>
              <p className="mt-6 text-sm leading-relaxed font-light text-cream-faint">
                Struck-through prices are the same items bought one at a time
                off the menu, not an invented list price. Payment is taken
                weekly by card ahead of the {DELIVERY.dropDay}{" "}
                run, and you can stop it at any point before the next one.{" "}
                <Link
                  href="/faq#subscription"
                  className="text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
                >
                  Skipping, swapping and cancelling
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SubscriptionTeaser;
