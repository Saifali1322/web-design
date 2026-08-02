import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY, SOCIALS } from "@/lib/catalogue";
import { faqGroups, type FaqLink } from "./content";

export const metadata: Metadata = {
  title: "Questions",
  description: `How long Juice Cartel keeps, why it is not pasteurised, what delivery across ${DELIVERY.city} costs, how to skip or cancel a weekly drop, and the allergen policy. Answered plainly, including the awkward ones.`,
  openGraph: {
    title: "Juice Cartel — questions, answered plainly",
    description: `Shelf life, cold chain, pricing, delivery areas, skipping and cancelling, allergens and food safety. Everything a first order usually gets stuck on.`,
    url: "https://juicecartel.uk/faq",
    siteName: "Juice Cartel",
    locale: "en_GB",
    type: "website",
  },
};

/**
 * FAQPage structured data, built from the same array the page renders, so the
 * two cannot disagree. Worth having: these are the exact questions people type
 * into a search box before a first order from a food business they have never
 * heard of.
 */
function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqGroups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a.join(" "),
        },
      })),
    ),
  };
}

function AnswerLink({ link }: { link: FaqLink }) {
  const external = /^(https?:|mailto:|tel:)/.test(link.href);
  const className =
    "inline-flex items-center gap-2 font-sans text-[0.625rem] tracking-label text-gold uppercase transition-colors hover:text-gold-bright";

  const inner = (
    <>
      {link.label}
      <span aria-hidden="true">&rarr;</span>
    </>
  );

  if (external) {
    return (
      <a href={link.href} className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {inner}
    </Link>
  );
}

export default function FaqPage() {
  return (
    <div className="bg-grain">
      {/* eslint-disable-next-line react/no-danger — generated above from our
          own typed content, never from user input. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />

      {/* Same max-w-6xl shell as the grid below, so the heading, the jump list
          and the questions all share one left edge. */}
      <section className="mx-auto grid max-w-6xl gap-x-14 gap-y-8 px-5 pt-14 pb-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
            <span className="h-px w-8 bg-gold/60" />
            Questions
          </p>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.06] text-foil sm:text-5xl">
            The things that stop a first order
          </h1>
        </div>

        <div className="lg:pb-2">
          <p className="text-base leading-relaxed text-cream sm:text-lg">
            Buying food from a kitchen you have never been to is a reasonable
            thing to hesitate over. These are the questions that actually get
            asked, including the ones with an awkward answer.
          </p>
          <p className="mt-4 text-sm leading-relaxed font-light text-cream-dim sm:text-base">
            If yours is not here, message{" "}
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-4"
            >
              {SOCIALS.handle}
            </a>{" "}
            or call{" "}
            <a
              href={`tel:${SOCIALS.phone}`}
              className="text-gold underline underline-offset-4"
            >
              {SOCIALS.phone}
            </a>
            . A real person answers, and it is the same person who pressed it.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="rule-foil" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-10 pb-24 sm:px-8 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:gap-16 lg:pt-14">
        {/* Sticky on desktop only: on a phone it is a plain jump list at the
            top, which is more useful than a rail that eats the viewport. */}
        <nav aria-label="Question categories" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[0.625rem] uppercase tracking-label text-cream-faint">
            Jump to
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5 lg:flex-col lg:gap-x-0 lg:gap-y-3">
            {faqGroups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#${group.id}`}
                  className="text-sm text-cream-dim transition-colors hover:text-gold"
                >
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14 sm:space-y-16">
          {faqGroups.map((group) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-heading`}
              /* Offset so the sticky header does not sit over the heading when
                 an in-page anchor lands on it. */
              className="scroll-mt-24"
            >
              <h2
                id={`${group.id}-heading`}
                className="font-display text-2xl text-foil sm:text-3xl"
              >
                {group.title}
              </h2>
              <p className="mt-2 text-sm text-cream-faint">{group.note}</p>

              <div className="mt-6 flex flex-col divide-y divide-ink-line border-y border-ink-line">
                {group.items.map((item) => (
                  <details key={item.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-cream marker:content-none">
                      <h3 className="text-[0.9375rem] leading-relaxed font-medium sm:text-base">
                        {item.q}
                      </h3>
                      <span
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-lg leading-none text-gold transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>

                    <div className="mt-3 max-w-2xl space-y-3 pr-8 text-sm leading-relaxed text-cream-dim">
                      {item.a.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}

                      {item.links && item.links.length > 0 && (
                        <p className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                          {item.links.map((link) => (
                            <AnswerLink key={link.href + link.label} link={link} />
                          ))}
                        </p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section
            aria-labelledby="still-stuck"
            className="scroll-mt-24 border border-ink-line bg-ink-card p-7 sm:p-9"
          >
            <h2
              id="still-stuck"
              className="font-display text-2xl text-foil sm:text-[1.75rem]"
            >
              Still stuck?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream-dim sm:text-base">
              Ask before you order rather than after, particularly about
              allergies. Call{" "}
              <a
                href={`tel:${SOCIALS.phone}`}
                className="text-gold underline underline-offset-4"
              >
                {SOCIALS.phone}
              </a>{" "}
              or message{" "}
              <a
                href={SOCIALS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline underline-offset-4"
              >
                {SOCIALS.handle}
              </a>
              , and you will get a straight answer — including &ldquo;no&rdquo;,
              if that is the honest one.
            </p>
            <p className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 font-sans text-[0.625rem] tracking-label text-gold uppercase transition-colors hover:text-gold-bright"
              >
                Who makes it <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 font-sans text-[0.625rem] tracking-label text-gold uppercase transition-colors hover:text-gold-bright"
              >
                The full menu <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/delivery"
                className="inline-flex items-center gap-2 font-sans text-[0.625rem] tracking-label text-gold uppercase transition-colors hover:text-gold-bright"
              >
                Delivery areas <span aria-hidden="true">&rarr;</span>
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
