import type { Metadata } from "next";
import type { ReactNode } from "react";
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
 * invented, and the page reads properly while they stay empty — the portrait
 * slot simply does not render, rather than showing an apology for itself.
 *
 *   name  — first name is enough. Used in the sign-off.
 *   photo — drop the file into /public/brand and put the path here, e.g.
 *           "/brand/founder.jpg". Portrait crop, roughly 4:5. A phone photo in
 *           the kitchen with the bottles behind you beats a studio shot.
 *   role  — caption under the portrait.
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

/**
 * Every long-form section runs on the same two-column rule: the heading holds
 * a narrow left rail and the prose sits in the column beside it. It keeps one
 * left edge down the whole page, and it gives a wide viewport something to do
 * other than sit empty next to a 65-character measure.
 */
function Section({
  id,
  heading,
  aside,
  children,
}: {
  id: string;
  heading: string;
  /** Optional extra in the left rail, under the heading. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-x-14 gap-y-6 border-t border-ink-line py-14 sm:py-16 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:py-20"
    >
      <div>
        <h2
          id={id}
          className="font-display text-2xl leading-tight text-foil sm:text-[1.75rem]"
        >
          {heading}
        </h2>
        {aside}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  const bakes = products.filter((product) => product.category === "bake");

  return (
    <div className="bg-grain">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* ---------- opening ---------- */}
        <header className="grid gap-x-14 gap-y-8 pt-14 pb-12 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pb-16">
          <div>
            <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
              <span className="h-px w-8 bg-gold/60" />
              Who makes this
            </p>
            <h1 className="mt-5 font-display text-[2.5rem] leading-[1.04] text-foil sm:text-5xl lg:text-[3.5rem]">
              One person,
              <br />
              one kitchen,
              <br />
              one {DELIVERY.dropDay} morning
            </h1>
          </div>

          <div className="lg:pb-2">
            <p className="text-base leading-relaxed text-cream sm:text-lg">
              Juice Cartel is not a brand with a factory behind it. It is one
              person in {DELIVERY.city} with a press, a fridge full of fruit and
              a delivery route that takes about three hours.
            </p>
            <p className="mt-4 text-sm leading-relaxed font-light text-cream-dim sm:text-base">
              The same pair of hands halves the oranges, fills the bottles,
              sticks the labels on straight, loads the cool bag and drives it to
              your door. That is not a charming detail — it is the constraint
              every rule on this site comes out of.
            </p>
          </div>
        </header>

        {/* ---------- spec strip ---------- */}
        <section aria-labelledby="spec">
          <h2 id="spec" className="sr-only">
            The business in five numbers
          </h2>
          <dl className="grid grid-cols-2 gap-px border border-ink-line bg-ink-line sm:grid-cols-3 lg:grid-cols-5">
            {SPEC.map((item, index) => (
              <div
                key={item.label}
                /* Five facts into two or three columns always leaves one hole
                   in the last row, and an empty tile in a hairline grid reads
                   as a rendering fault. The last one widens to close it. */
                className={`bg-ink-card px-5 py-6 sm:px-6 sm:py-7 ${
                  index === SPEC.length - 1
                    ? "col-span-2 sm:col-span-2 lg:col-span-1"
                    : ""
                }`}
              >
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
        <Section id="why" heading="The short date is the point">
          <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-cream-dim sm:text-base">
            <p>
              You can buy juice that lasts a month. It exists because it has
              been heated, or put under enough pressure to kill everything
              living in it, and then sent to a warehouse to wait. That is a
              perfectly sensible way to run a drink company and it puts
              affordable juice in every shop in the country.
            </p>
            <p>
              Ours has {KEEPS} days on it. Nothing happens to the juice between
              the press and the bottle, so nothing has been done to it to make
              it keep. Every rule on this site follows from that one fact — the
              Thursday deadline, the single delivery day, the{" "}
              {DELIVERY.postcodes.length} postcodes, the{" "}
              {formatPrice(DELIVERY.minimumOrder)} minimum. None of it is
              scarcity dressed up as a rule. It is what happens when the thing
              you sell has seventy-two hours in it.
            </p>
          </div>

          <blockquote className="mt-9 border-l-2 border-gold-deep pl-6 sm:pl-8">
            <p className="max-w-2xl font-display text-xl leading-snug text-cream sm:text-2xl lg:text-[1.75rem]">
              The {KEEPS}-day date is not a compromise we are apologising for.
              It is the receipt.
            </p>
          </blockquote>
        </Section>

        {/* ---------- the morning ---------- */}
        <Section
          id="morning"
          heading="The morning it goes out"
          aside={
            /* The portrait renders only once FOUNDER.photo is set — see the
               note at the top of this file. It lives in the heading rail so
               that adding it later changes nothing about the prose column. */
            FOUNDER.photo ? (
              <figure className="mt-6 hidden lg:block">
                <div className="relative aspect-[4/5] overflow-hidden border border-ink-line bg-ink-card">
                  <Image
                    src={FOUNDER.photo}
                    alt={
                      FOUNDER.name
                        ? `${FOUNDER.name}, who makes Juice Cartel`
                        : "The person who makes Juice Cartel"
                    }
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-xs leading-relaxed text-cream-faint">
                  {FOUNDER.name ? `${FOUNDER.name} — ` : ""}
                  {FOUNDER.role}
                </figcaption>
              </figure>
            ) : null
          }
        >
          <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-cream-dim sm:text-base">
            <p>
              Fruit gets bought against a list, not against a hope. The list
              closes on Thursday, the shopping happens after it, and on{" "}
              {DELIVERY.dropDay} morning the whole lot goes through the press in
              one run. Oranges halved on the counter. The jug filled and poured
              off into bottles one at a time. Caps on by hand. The round black
              label stuck on square — <em>freshly made</em> arced over the top
              of it, {juices[0].size} underneath the name.
            </p>
            <p>
              By the time the last one is capped the first is already cold. It
              goes out in a cool bag with ice packs, one route across the city,
              and it is in your fridge the same day it was fruit. That is the
              entire operation. There is no second site, no overnight run and
              nothing held back from last week.
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

          {FOUNDER.photo && (
            <figure className="mt-8 lg:hidden">
              <div className="relative aspect-[4/5] max-w-xs overflow-hidden border border-ink-line bg-ink-card">
                <Image
                  src={FOUNDER.photo}
                  alt={
                    FOUNDER.name
                      ? `${FOUNDER.name}, who makes Juice Cartel`
                      : "The person who makes Juice Cartel"
                  }
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-xs leading-relaxed text-cream-faint">
                {FOUNDER.name ? `${FOUNDER.name} — ` : ""}
                {FOUNDER.role}
              </figcaption>
            </figure>
          )}
        </Section>

        {/* ---------- refusals ---------- */}
        <Section
          id="refusals"
          heading="What we will not do"
          aside={
            <p className="mt-4 max-w-xs text-sm leading-relaxed font-light text-cream-faint">
              Anyone can list what they stand for. This is the other list — six
              things we have decided against, each of which you could catch us
              breaking.
            </p>
          }
        >
          <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {REFUSALS.map((item) => (
              <li key={item.title}>
                <h3 className="flex items-start gap-3 font-display text-lg leading-snug text-cream">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"
                  />
                  {item.title}
                </h3>
                <p className="mt-2.5 pl-[1.125rem] text-sm leading-relaxed font-light text-cream-dim">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* ---------- honest limits ---------- */}
        <Section id="limits" heading="What this is not, yet">
          <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-cream-dim sm:text-base">
            <p>
              It is worth being straight about the size of it. There is no shop
              to walk into. There is one delivery day a week, not seven. The
              menu moves with the fruit — mango comes off when it stops being
              worth pressing, and{" "}
              {bakes.length > 0
                ? bakes[bakes.length - 1].name
                : "the crunch cake"}{" "}
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
        </Section>

        {/* ---------- sign-off ---------- */}
        <section
          aria-labelledby="talk"
          className="mt-14 mb-24 border border-ink-line bg-ink-card p-7 sm:mt-16 sm:p-10"
        >
          <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="flex items-start gap-5">
                <BottleMark className="mt-1 h-10 w-auto shrink-0 text-gold-deep" />
                <div>
                  <h2
                    id="talk"
                    className="font-display text-2xl text-foil sm:text-[1.75rem]"
                  >
                    Ask before you order
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-cream-dim sm:text-base">
                    There is no support desk. The Instagram messages, the
                    Snapchat replies and the phone all reach the person who
                    pressed it. If you want to know what is in something, when
                    it was made or whether it is safe for you, ask — you will
                    get an answer from somebody who was standing there when it
                    went in the bottle.
                  </p>
                </div>
              </div>

              {FOUNDER.name && (
                <p className="mt-7 font-script text-2xl text-gold/90 lg:pl-[3.75rem]">
                  {FOUNDER.name}
                </p>
              )}
            </div>

            <div className="border-t border-ink-line pt-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-14">
              <p className="text-[0.625rem] uppercase tracking-label text-cream-faint">
                Straight through to the kitchen
              </p>
              <a
                href={`tel:${SOCIALS.phone}`}
                className="numeric mt-3 block font-display text-2xl text-gold transition-colors hover:text-gold-bright"
              >
                {SOCIALS.phone}
              </a>
              <a
                href={SOCIALS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
              >
                {SOCIALS.handle} on Instagram
              </a>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ButtonLink href="/menu" variant="primary" size="md">
                  See the menu
                </ButtonLink>
                <ButtonLink href="/faq" variant="secondary" size="md">
                  Read the FAQ
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
