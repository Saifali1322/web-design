import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY, SOCIALS, formatPrice } from "@/lib/catalogue";
import PostcodeCheck from "@/components/subscribe/PostcodeCheck";

export const metadata: Metadata = {
  title: "Delivery",
  description: `Juice Cartel delivers across ${DELIVERY.city} every ${DELIVERY.dropDay}. Check your postcode in one second, see the minimum order and free delivery threshold, or arrange collection.`,
};

/**
 * Delivery, and the postcode question.
 *
 * Eleven outward codes is a small route, so this page leads with the checker
 * instead of burying it under three sections of copy. The single most useful
 * thing it can do for a stranger is tell them immediately whether the rest of
 * the site is relevant to them. Everything after that answers either "yes, and
 * then what" or "no, so what now".
 *
 * The page was a stack of identically-sized centred bands. It is now two
 * shapes: a wide masthead with the checker set into it off-centre, then a
 * narrow reading column for the rules. Two shapes is enough; four would be a
 * different kind of noise.
 */

const facts = [
  {
    label: "Delivery day",
    value: DELIVERY.dropDay,
    note: "One route, once a week. That is what keeps it fresh.",
  },
  {
    label: "Minimum order",
    value: formatPrice(DELIVERY.minimumOrder),
    note: "Below this we'd be losing money on fuel alone, so we can't take it.",
  },
  {
    label: "Free delivery",
    value: `Over ${formatPrice(DELIVERY.freeDeliveryThreshold)}`,
    note: `Under that, delivery is a flat ${formatPrice(DELIVERY.deliveryFee)}.`,
  },
];

/**
 * The route is NG1–NG9, NG11 and NG16. Anyone who lives in Nottingham will
 * notice what is missing before we do, so the gaps get said out loud rather
 * than left to look like a typo.
 */
function missingCodes(): string[] {
  const on = new Set<string>(DELIVERY.postcodes);
  const absent: number[] = [];
  for (let n = 1; n <= 16; n += 1) {
    if (!on.has(`NG${n}`)) absent.push(n);
  }

  // Collapse runs, so five missing codes read as "NG12 to NG15" rather than
  // as a list somebody forgot to edit.
  const runs: string[] = [];
  let i = 0;
  while (i < absent.length) {
    let j = i;
    while (j + 1 < absent.length && absent[j + 1] === absent[j] + 1) j += 1;
    runs.push(
      i === j ? `NG${absent[i]}` : `NG${absent[i]} to NG${absent[j]}`,
    );
    i = j + 1;
  }
  return runs;
}

export default function DeliveryPage() {
  const gaps = missingCodes();

  return (
    <div className="bg-grain">
      {/* ---------- masthead: title left, checker set in on the right ------- */}
      <section className="mx-auto w-full max-w-7xl px-5 pt-14 sm:px-8 sm:pt-20">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="tracking-label text-xs uppercase text-gold">
              Delivery
            </p>
            <h1 className="mt-4 font-display text-4xl text-foil sm:text-5xl">
              Across {DELIVERY.city},
              <br />
              every {DELIVERY.dropDay}
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-cream-dim sm:text-base">
              One van, one afternoon a week. That is how everything stays cold
              and the price stays sensible, and it is also why the map is small.
              So before anything else: do we actually reach you?
            </p>
          </div>

          {/* The checker is the whole point of the page, so it gets a real
              panel rather than a centred box with air on both sides. */}
          <div
            id="check"
            className="scroll-mt-28 border border-gold-dim/50 bg-ink-card p-6 sm:p-8"
          >
            <h2 className="font-display text-2xl text-foil sm:text-3xl">
              Do we reach you?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cream-dim">
              The first part of your postcode is enough. We&rsquo;ll remember it
              for the basket, so you only ever do this once.
            </p>
            <PostcodeCheck className="mt-6" />
          </div>
        </div>
      </section>

      {/* ---------- the three numbers ---------- */}
      <section
        aria-labelledby="rules"
        className="mx-auto w-full max-w-7xl px-5 pt-14 sm:px-8 sm:pt-16"
      >
        <h2 id="rules" className="sr-only">
          Delivery rules
        </h2>
        {/* Uneven on purpose. The day is a word, the minimum is four
            characters, the free-delivery line carries a second condition. */}
        <dl className="grid gap-px border border-ink-line bg-ink-line sm:grid-cols-[0.9fr_0.85fr_1.25fr]">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-ink-card px-6 py-7 sm:px-7">
              <dt className="text-xs uppercase tracking-label text-cream-faint">
                {fact.label}
              </dt>
              <dd>
                <span className="numeric mt-2 block font-display text-2xl text-gold-bright">
                  {fact.value}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-cream-dim">
                  {fact.note}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- the codes ---------- */}
      <section
        aria-labelledby="areas"
        className="mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 sm:pt-20"
      >
        <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <div>
            <h2 id="areas" className="font-display text-2xl text-foil sm:text-3xl">
              The {DELIVERY.postcodes.length} codes{" "}
              <br className="hidden lg:block" /> on the route
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-dim">
              Match the first part of your postcode against these. If it is
              here, you are in.
            </p>
          </div>

          <div className="min-w-0">
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {DELIVERY.postcodes.map((code) => (
                <li key={code}>
                  <span className="numeric flex items-center justify-center border border-gold-dim/50 bg-ink-card py-3 text-sm font-medium tracking-widest text-gold-bright">
                    {code}
                  </span>
                </li>
              ))}
            </ul>

            {/* Margin note. Nobody would design this in; somebody who has
                driven the round would write it. */}
            {gaps.length > 0 && (
              <p className="mt-6 max-w-xl border-l border-gold-deep pl-4 text-sm leading-relaxed text-cream-faint">
                Yes, the list skips {gaps.join(", ")}. That is not an oversight
                and it is not a slight on {gaps[0]}. It is simply where one
                afternoon of driving runs out, and the route only grows once
                the streets already on it are full.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---------- collection: narrower measure, different ground ---------- */}
      <section
        aria-labelledby="collection"
        className="mt-16 border-y border-ink-line bg-ink-raised sm:mt-20"
      >
        <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
          <h2
            id="collection"
            className="font-display text-2xl text-foil sm:text-3xl"
          >
            Outside the route? Collection still works
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream-dim sm:text-base">
            If your code is not on the list, or you are only passing through{" "}
            {DELIVERY.city}, message us on{" "}
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-2"
            >
              Instagram
            </a>{" "}
            before {DELIVERY.dropDay}{" "}
            and we&rsquo;ll sort out a time and a place near the kitchen. No
            minimum order applies to collections.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream-dim sm:text-base">
            Or call{" "}
            <a
              href={`tel:${SOCIALS.phone}`}
              className="numeric text-gold underline underline-offset-2"
            >
              {SOCIALS.phone}
            </a>{" "}
            if it&rsquo;s easier to say out loud.
          </p>

          <p className="mt-8 border-t border-ink-line pt-6 text-sm leading-relaxed text-cream-faint">
            Ordering with allergies in mind? Read the{" "}
            <Link
              href="/allergens"
              className="text-gold underline underline-offset-2"
            >
              full allergen matrix
            </Link>{" "}
            first. And if you would rather it just turned up every{" "}
            {DELIVERY.dropDay}{" "}
            without you thinking about it, that is the{" "}
            <Link
              href="/subscribe"
              className="text-gold underline underline-offset-2"
            >
              weekly subscription
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
