import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { SOCIALS } from "@/lib/catalogue";

/* ---------------------------------------------------------------------------
 * REVIEWS. Real quotes only.
 *
 * This array is deliberately empty. It previously held three invented
 * testimonials with invented names, which on a food business is not a design
 * placeholder. It is a false trust signal, and the one thing a small kitchen
 * cannot afford to be caught doing.
 *
 * TO FILL IT: paste real messages (Instagram, Snapchat, TikTok comments,
 * WhatsApp) that the customer has agreed to have published, and the section
 * below switches from the empty state to the quote grid on its own. Keep the
 * shape: one concrete detail, one reason they came back. Attribution is a
 * first name plus initial and an outward postcode: credible without
 * identifying anyone.
 * ------------------------------------------------------------------------ */
interface Review {
  quote: string;
  /** First name and initial, e.g. "Amira K." */
  name: string;
  /** Occupation and/or outward code, e.g. "Personal trainer · NG2". */
  detail: string;
}

const REVIEWS: Review[] = [];

const CHANNELS = [
  { label: "TikTok", href: SOCIALS.tiktok },
  { label: "Instagram", href: SOCIALS.instagram },
  { label: "Snapchat", href: SOCIALS.snapchat },
] as const;

/**
 * Absence of reviews is a fact, so it is stated rather than papered over. What
 * is below is the proof that does exist: three things a stranger can go and
 * check for themselves in under a minute, which is more than a wall of
 * five-star cards would give them.
 */
function Checkable() {
  return (
    <ul className="divide-y divide-ink-line border-y border-ink-line">
      <li className="py-6">
        <h4 className="font-display text-lg leading-snug text-cream">
          Everything, as it is pressed
        </h4>
        <p className="mt-2 text-sm leading-relaxed font-light text-cream-dim">
          The bottles, the fruit, the kitchen and the Sunday run all get posted
          the day they happen. Dated and public, and not tidied up afterwards.
        </p>
        <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          {CHANNELS.map((channel) => (
            <li key={channel.label}>
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 font-sans text-[0.6875rem] tracking-label text-cream-dim uppercase transition-colors duration-300 hover:text-gold-bright"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rotate-45 bg-gold-deep transition-colors duration-300 group-hover:bg-gold-bright"
                />
                {channel.label}
                <span className="sr-only">, {SOCIALS.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </li>

      <li className="py-6">
        <h4 className="font-display text-lg leading-snug text-cream">
          A number a person answers
        </h4>
        <p className="mt-2 text-sm leading-relaxed font-light text-cream-dim">
          There is no support desk and no ticket queue. The phone, the messages
          and the press are the same person.
        </p>
        <a
          href={`tel:${SOCIALS.phone}`}
          className="numeric mt-4 inline-block font-display text-xl text-gold transition-colors hover:text-gold-bright"
        >
          {SOCIALS.phone}
        </a>
      </li>

      <li className="py-6">
        <h4 className="font-display text-lg leading-snug text-cream">
          Who actually makes it
        </h4>
        <p className="mt-2 text-sm leading-relaxed font-light text-cream-dim">
          A home kitchen in Nottingham with one delivery route, and a shelf
          life short enough that none of it could be faked at scale.
        </p>
        <Link
          href="/about"
          className="mt-4 inline-flex items-center gap-2 font-sans text-[0.6875rem] tracking-label text-gold uppercase transition-colors hover:text-gold-bright"
        >
          Read the story
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </li>
    </ul>
  );
}

export function SocialProof() {
  const hasReviews = REVIEWS.length > 0;

  return (
    <section
      aria-labelledby="proof-heading"
      className="relative border-t border-ink-line py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="font-sans text-[0.6875rem] tracking-label text-cream-faint uppercase">
                Regulars
              </p>
              <h2
                id="proof-heading"
                className="text-foil mt-4 font-display text-3xl leading-none font-medium tracking-[0.06em] sm:text-4xl lg:text-5xl"
              >
                WORD OF MOUTH
              </h2>
            </div>
            <p className="font-script text-2xl leading-none text-gold/85 sm:text-3xl">
              {hasReviews ? "in their words" : "yours, not ours"}
            </p>
          </div>
        </Reveal>

        <div className="rule-foil mt-8 mb-10 sm:mt-10 sm:mb-14" />

        {hasReviews ? (
          <ul className="grid gap-8 sm:gap-10 lg:grid-cols-3 lg:gap-12">
            {REVIEWS.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 0.1}>
                <figure className="relative h-full pt-8">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 font-display text-6xl leading-none text-gold/25 select-none"
                  >
                    &ldquo;
                  </span>

                  <blockquote className="font-display text-[1.0625rem] leading-[1.7] text-cream/90 sm:text-lg">
                    {item.quote}
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-3">
                    <span aria-hidden="true" className="h-px w-6 bg-gold/50" />
                    <span className="font-sans text-[0.6875rem] tracking-[0.16em] text-gold uppercase">
                      {item.name}
                    </span>
                    <span className="font-sans text-[0.6875rem] tracking-[0.12em] text-cream-faint uppercase">
                      {item.detail}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        ) : (
          /* items-start, not stretch: the statement is short and the list of
             checkable things is long, and a panel stretched to match the taller
             column would just be a box with 200px of nothing at the bottom. */
          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <Reveal>
              <div className="border border-ink-line bg-ink-card p-7 sm:p-9">
                <h3 className="font-display text-2xl leading-tight text-cream sm:text-[1.75rem]">
                  There is nothing here yet
                </h3>

                <div className="mt-5 space-y-4 text-sm leading-relaxed font-light text-cream-dim sm:text-[0.9375rem]">
                  <p>
                    No quotes. No stars, and no counter ticking up. Not because
                    nobody has said anything, but because we are not going to
                    write them ourselves.
                  </p>
                  <p>
                    A testimonial from a customer who does not exist is the
                    easiest thing on a website to make up, and it is the fastest
                    way for a kitchen to lose the only thing it really has. So
                    this space stays empty until somebody real fills it.
                  </p>
                  <p className="text-cream">
                    If you have ordered and you would say something, message{" "}
                    <a
                      href={SOCIALS.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
                    >
                      {SOCIALS.handle}
                    </a>
                    . Send it in your own words and it goes up here with your
                    name on it.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="lg:mt-10">
              <p className="font-sans text-[0.625rem] tracking-label text-cream-faint uppercase">
                What you can check instead
              </p>
              <div className="mt-5">
                <Checkable />
              </div>
            </Reveal>
          </div>
        )}

        {/* ---------- handles ---------- */}
        {hasReviews && (
          <Reveal delay={0.05}>
            <div className="mt-16 flex flex-col gap-6 border-t border-ink-line pt-8 sm:mt-20 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-sans text-[0.6875rem] tracking-label text-cream-faint uppercase">
                Everywhere as{" "}
                <span className="text-gold">{SOCIALS.handle}</span>
              </p>

              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-8">
                {CHANNELS.map((channel) => (
                  <li key={channel.label}>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 font-sans text-[0.6875rem] tracking-label text-cream-dim uppercase transition-colors duration-300 hover:text-gold-bright"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rotate-45 bg-gold-deep transition-colors duration-300 group-hover:bg-gold-bright"
                      />
                      {channel.label}
                      <span className="sr-only">, {SOCIALS.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

export default SocialProof;
