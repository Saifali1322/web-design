import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BottleMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import {
  DELIVERY,
  SOCIALS,
  formatPrice,
  juices,
  products,
} from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "About",
  description: `Juice Cartel is one person in ${DELIVERY.city} with a press, a fridge full of fruit and a ${DELIVERY.dropDay} delivery route. Why the juice only keeps three days, what goes in it, and what we will not do.`,
  openGraph: {
    title: "About Juice Cartel — one kitchen, one morning, one route",
    description: `Made by one person in ${DELIVERY.city}, pressed the morning it goes out and delivered every ${DELIVERY.dropDay}. The reasoning behind the three-day date, the Thursday deadline and the ${DELIVERY.postcodes.length} postcodes.`,
    url: "https://juicecartel.uk/about",
    siteName: "Juice Cartel",
    locale: "en_GB",
    type: "article",
  },
};

/* ---------------------------------------------------------------------------
 * FOUNDER — owner, fill this in.
 *
 * A face and a first name is the single strongest trust signal a one-person
 * food business has, and it is the one thing on this page that cannot be
 * written from the product. Both fields are null on purpose: nothing here is
 * invented, and the layout collapses to a single column and still reads
 * properly while they stay empty.
 *
 *   name  — first name only is fine. Used in the sign-off.
 *   photo — drop the file into /public/brand and put the path here, e.g.
 *           "/brand/founder.jpg". Portrait crop, roughly 4:5. A phone photo in
 *           the kitchen with the bottles behind you beats a studio shot.
 *   role  — optional caption under the portrait.
 * ------------------------------------------------------------------------ */
const FOUNDER: { name: string | null; photo: string | null; role: string } = {
  name: null,
  photo: null,
  role: `Presses it, drives it, answers the phone · ${DELIVERY.city}`,
};

/** Counted off the catalogue so the spec strip cannot drift from the menu. */
const KEEPS = Math.min(...juices.map((juice) => juice.keepsDays));
const SINGLE_INGREDIENT = juices.filter((j) => j.ingredients.length === 1).length;

const SPEC = [
  { label: "Made in", value: DELIVERY.city },
  { label: "Pressed", value: `${DELIVERY.dropDay} morning` },
  { label: "Keeps", value: `${KEEPS} days` },
  { label: "Postcodes", value: String(DELIVERY.postcodes.length) },
  { label: "People", value: "One" },
] as const;

/**
 * A list of refusals is a stronger trust device than a list of promises,
 * because every line is something a customer could catch us breaking. Nothing
 * here is aspirational — each one is already true of the site or the product.
 */
const REFUSALS = [
  {
    title: "We do not press ahead",
    body: "Nothing is made until it has been ordered. A bottle sitting in a fridge waiting for somebody to want it is a bottle that is already a day worse.",
  },
  {
    title: "We do not water it down",
    body: `${SINGLE_INGREDIENT} of the ${juices.length} juices have one ingredient on the list. Nothing is stretched with water, apple juice or anything else that costs less than the fruit on the label.`,
  },
  {
    title: "We do not add anything to make it last",
    body: "No preservative, no stabiliser, nothing to hold the colour. Which is exactly why it has a short date on it, and why that date is printed rather than buried.",
  },
  {
    title: "We do not take an order we cannot reach",
    body: `The route is ${DELIVERY.postcodes.length} outward codes wide. If yours is not one of them the site says so before you pay, because a box that arrives warm is worse than one that never went out.`,
  },
  {
    title: "We do not guess at allergens",
    body: "Where the recipes have not been checked line by line, the site says so in plain words instead of printing a confident table. Guessing is how somebody gets hurt.",
  },
  {
    title: "We do not write our own reviews",
    body: "There are no testimonials on this site yet because nobody has sent one we are allowed to print. When somebody does, it goes up in their words with their name on it.",
  },
] as const;

export default function AboutPage() {
  const bakes = products.filter((product) => product.category === "bake");

  return (
    <div className="bg-grain">
      {/* ---------- opening ---------- */}
      <section className="mx-auto max-w-4xl px-5 pt-14 pb-10 sm:px-8 sm:pt-20 sm:pb-14">
        <p className="tracking-label text-xs uppercase text-gold">
          Who makes this
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[1.08] text-foil sm:text-5xl lg:text-[3.5rem]">
          One person, one kitchen,
          <br className="hidden sm:block" /> one {DELIVERY.dropDay} morning
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream sm:text-lg">
          Juice Cartel is not a brand with a factory behind it. It is one person
          in {DELIVERY.city} with a press, a fridge full of fruit and a delivery
          route that takes about three hours.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
          The same pair of hands halves the oranges, fills the bottles, sticks
          the labels on straight, loads the cool bag and drives it to your door.
          That is not a charming detail — it is the constraint that every rule on
          this site comes out of.
        </p>
      </section>

      {/* ---------- spec strip ---------- */}
      <section aria-labelledby="spec" className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="spec" className="sr-only">
          The business in five numbers
        </h2>
        <dl className="grid grid-cols-2 gap-px border border-ink-line bg-ink-line sm:grid-cols-3 lg:grid-cols-5">
          {SPEC.map((item) => (
            <div key={item.label} className="bg-ink-card px-5 py-6 sm:px-6 sm:py-7">
              <dt className="text-[0.5625rem] uppercase tracking-label text-cream-faint sm:text-[0.625rem]">
                {item.label}
              </dt>
              <dd className="numeric mt-2.5 font-display text-xl leading-none text-gold-bright sm:text-2xl">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- the argument ---------- */}
      <section
        aria-labelledby="why"
        className="mx-auto max-w-4xl px-5 pt-16 pb-10 sm:px-8 sm:pt-20"
      >
        <h2
          id="why"
          className="font-display text-2xl text-foil sm:text-3xl"
        >
          The short date is the point
        </h2>
        <div className="mt-5 max-w-2xl space-y-4 text-sm leading-relaxed text-cream-dim sm:text-base">
          <p>
            You can buy juice that lasts a month. It exists because it has been
            heated, or put under enough pressure to kill everything living in
            it, and then sent to a warehouse to wait. That is a perfectly
            sensible way to run a drink company and it puts affordable juice in
            every shop in the country.
          </p>
          <p>
            Ours has {KEEPS} days on it. Nothing happens to the juice between
            the press and the bottle, so nothing has been done to it to make it
            keep. Every rule on this site follows from that one fact — the
            Thursday deadline, the single delivery day, the{" "}
            {DELIVERY.postcodes.length} postcodes, the{" "}
            {formatPrice(DELIVERY.minimumOrder)} minimum. None of it is scarcity
            dressed up as a rule. It is what
            happens when the thing you sell has seventy-two hours in it.
          </p>
        </div>

        <blockquote className="mt-10 border-l-2 border-gold-deep pl-6 sm:mt-12 sm:pl-8">
          <p className="font-display text-2xl leading-snug text-cream sm:text-[1.75rem]">
            The {KEEPS}-day date is not a compromise we are apologising for. It
            is the receipt.
          </p>
        </blockquote>
      </section>

      {/* ---------- the morning ---------- */}
      <section
        aria-labelledby="morning"
        className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"
      >
        <div
          className={
            FOUNDER.photo
              ? "grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16"
              : ""
          }
        >
          <div className={FOUNDER.photo ? "" : "max-w-4xl"}>
            <h2
              id="morning"
              className="font-display text-2xl text-foil sm:text-3xl"
            >
              The morning it goes out
            </h2>
            <div className="mt-5 max-w-2xl space-y-4 text-sm leading-relaxed text-cream-dim sm:text-base">
              <p>
                Fruit gets bought against a list, not against a hope. The list
                closes on Thursday, the shopping happens after it, and on{" "}
                {DELIVERY.dropDay} morning the whole lot goes through the press
                in one run. Oranges halved on the counter. The jug filled and
                poured off into bottles one at a time. Caps on by hand. The
                round black label stuck on square — <em>freshly made</em> arced
                over the top of it, 330ml underneath the name.
              </p>
              <p>
                By the time the last one is capped the first is already cold. It
                goes out in a cool bag with ice packs, one route across the
                city, and it is in your fridge the same day it was fruit. That
                is the entire operation. There is no second site, no overnight
                run and nothing held back from last week.
              </p>
              <p>
                It is a home kitchen, and the site says so on the{" "}
                <Link
                  href="/allergens"
                  className="text-gold underline underline-offset-4"
                >
                  allergen page
                </Link>{" "}
                rather than leaving you to work it out. One kitchen means milk,
                wheat, soya and nuts are all handled in the same room as the
                juice, and no amount of housekeeping makes that untrue.
              </p>
            </div>
          </div>

          {/* Portrait renders only once FOUNDER.photo is set — see the note at
              the top of this file. An empty frame with a caption apologising
              for itself would be worse than the single-column layout. */}
          {FOUNDER.photo && (
            <figure className="lg:pt-2">
              <div className="relative aspect-[4/5] overflow-hidden border border-ink-line bg-ink-card">
                <Image
                  src={FOUNDER.photo}
                  alt={
                    FOUNDER.name
                      ? `${FOUNDER.name}, who makes Juice Cartel`
                      : "The person who makes Juice Cartel"
                  }
                  fill
                  sizes="(max-width: 1023px) 92vw, 360px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-xs leading-relaxed text-cream-faint">
                {FOUNDER.name ? `${FOUNDER.name} — ` : ""}
                {FOUNDER.role}
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* ---------- refusals ---------- */}
      <section
        aria-labelledby="refusals"
        className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"
      >
        <div className="rule-foil mb-10 sm:mb-12" />
        <h2
          id="refusals"
          className="font-display text-2xl text-foil sm:text-3xl"
        >
          What we will not do
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
          Anyone can list what they stand for. This is the other list — six
          things we have decided against, each of which you could catch us
          breaking.
        </p>

        <ul className="mt-10 grid gap-x-12 gap-y-9 sm:grid-cols-2 lg:gap-x-16">
          {REFUSALS.map((item) => (
            <li key={item.title}>
              <h3 className="flex items-start gap-3 font-display text-lg leading-snug text-cream sm:text-xl">
                <span
                  aria-hidden="true"
                  className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"
                />
                {item.title}
              </h3>
              <p className="mt-2.5 pl-[1.125rem] text-sm leading-relaxed text-cream-dim">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- honest limits ---------- */}
      <section
        aria-labelledby="limits"
        className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16"
      >
        <div className="rule-foil mb-10 sm:mb-12" />
        <h2
          id="limits"
          className="font-display text-2xl text-foil sm:text-3xl"
        >
          What this is not, yet
        </h2>
        <div className="mt-5 max-w-2xl space-y-4 text-sm leading-relaxed text-cream-dim sm:text-base">
          <p>
            It is worth being straight about the size of it. There is no shop to
            walk into. There is one delivery day a week, not seven. The menu
            moves with the fruit — mango comes off when it stops being worth
            pressing, and{" "}
            {bakes.length > 0 ? bakes[bakes.length - 1].name : "the crunch cake"}{" "}
            has a month of the year where it outsells everything else on the
            list.
          </p>
          <p>
            It is being built up on purpose, one route at a time. A second
            postcode zone only opens once the first one is genuinely full,
            because a missed delivery costs more than a new customer is worth.
            If you are outside {DELIVERY.city} and we tell you we cannot reach
            you, that is not a waiting-list tactic. We just cannot get a cold
            bottle to you in time.
          </p>
        </div>
      </section>

      {/* ---------- sign-off ---------- */}
      <section
        aria-labelledby="talk"
        className="mx-auto max-w-4xl px-5 pt-12 pb-24 sm:px-8 sm:pt-16"
      >
        <div className="border border-ink-line bg-ink-card p-7 sm:p-10">
          <div className="flex items-start gap-5">
            <BottleMark className="mt-1 h-10 w-auto shrink-0 text-gold-deep" />
            <div>
              <h2
                id="talk"
                className="font-display text-2xl text-foil sm:text-3xl"
              >
                Ask before you order
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream-dim sm:text-base">
                There is no support desk. The Instagram messages, the Snapchat
                replies and the phone all reach the person who pressed it. If
                you want to know what is in something, when it was made or
                whether it is safe for you, ask — you will get an answer from
                somebody who was standing there when it went in the bottle.
              </p>

              <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cream-dim">
                <a
                  href={`tel:${SOCIALS.phone}`}
                  className="numeric font-display text-xl text-gold transition-colors hover:text-gold-bright"
                >
                  {SOCIALS.phone}
                </a>
                <a
                  href={SOCIALS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
                >
                  {SOCIALS.handle} on Instagram
                </a>
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/menu" variant="primary" size="md">
                  See the menu
                </ButtonLink>
                <ButtonLink href="/faq" variant="secondary" size="md">
                  Read the FAQ
                </ButtonLink>
              </div>

              {FOUNDER.name && (
                <p className="mt-8 font-script text-2xl text-gold/90">
                  {FOUNDER.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
