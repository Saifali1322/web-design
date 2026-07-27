import Reveal from "@/components/ui/Reveal";
import { SOCIALS } from "@/lib/catalogue";

/* ---------------------------------------------------------------------------
 * PLACEHOLDER COPY — REPLACE BEFORE LAUNCH.
 *
 * These three quotes are written to be plausible, not real. Nobody said them.
 * Swap in genuine reviews (TikTok comments, WhatsApp messages, Google
 * reviews) with permission from the customer, and keep the shape: one
 * concrete detail, one reason they came back. Attribution is first name plus
 * initial and an outward postcode — enough to be credible, not enough to
 * identify anyone.
 * ------------------------------------------------------------------------ */
const TESTIMONIALS = [
  {
    quote:
      "I'm in Lenton so it lands before I've properly woken up. The mango one has replaced whatever I used to buy from the shop on the way to campus, and it's cheaper by the week.",
    name: "Amira K.",
    detail: "Student · NG7",
  },
  {
    quote:
      "I put a few clients onto the carrot and ginger and now I get asked about it more than my programming. Having it in the fridge Sunday night means Monday isn't a decision.",
    name: "Dan R.",
    detail: "Personal trainer · NG2",
  },
  {
    quote:
      "Ordered the crunch cake for my daughter's birthday and there was none left by the time I sat down. It's a standing Sunday order now — three juices and whatever the dessert is that week.",
    name: "Priya S.",
    detail: "NG5",
  },
] as const;

const CHANNELS = [
  { label: "TikTok", href: SOCIALS.tiktok },
  { label: "Instagram", href: SOCIALS.instagram },
  { label: "Snapchat", href: SOCIALS.snapchat },
] as const;

export function SocialProof() {
  return (
    <section
      aria-labelledby="proof-heading"
      className="relative border-t border-ink-line py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
                <span className="h-px w-8 bg-gold/60" />
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
              mostly, anyway
            </p>
          </div>
        </Reveal>

        <div className="rule-foil mt-8 mb-10 sm:mt-10 sm:mb-14" />

        <ul className="grid gap-8 sm:gap-10 lg:grid-cols-3 lg:gap-12">
          {TESTIMONIALS.map((item, index) => (
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

        {/* ---------- handles ---------- */}
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
                    <span className="sr-only"> — {SOCIALS.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default SocialProof;
