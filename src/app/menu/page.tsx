import type { Metadata } from "next";
import Link from "next/link";
import {
  DELIVERY,
  formatPrice,
  products,
  SOCIALS,
  type Category,
} from "@/lib/catalogue";
import MenuGrid from "@/components/menu/MenuGrid";
import MenuSpotlight from "@/components/menu/MenuSpotlight";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Cold pressed juices, protein shakes and Cartel Bakes. Pressed and made fresh, delivered every Sunday across Nottingham. Full ingredients and allergens for every item.",
};

/**
 * The headline is the stock count, read off the catalogue rather than written.
 * It is a better first line than an adjective: a stranger learns the size of
 * the operation in four words, and a new flavour changes the heading without
 * anybody remembering to edit it.
 */
const NOUN: Record<Category, [string, string]> = {
  juice: ["juice", "juices"],
  fuel: ["shake", "shakes"],
  bake: ["bake", "bakes"],
};

const COUNTS = (["juice", "fuel", "bake"] as Category[])
  .map((category) => ({
    n: products.filter((p) => p.category === category).length,
    noun: NOUN[category],
  }))
  .filter((entry) => entry.n > 0);

export default function MenuPage() {
  return (
    <div className="bg-grain">
      {/* The heading sits in the wider shell and the reading column in the
          narrower one, so at desktop widths the title hangs a clear 64px to
          the left of everything under it. Below 1280px the two containers
          resolve to the same width and the hang closes itself, which is why
          this cannot push the page sideways. */}
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14">
        <p className="tracking-label text-xs uppercase text-gold">
          The full menu
        </p>
        <h1 className="numeric mt-4 font-display text-4xl text-foil sm:text-5xl">
          {COUNTS.map((entry, i) => (
            <span key={entry.noun[1]}>
              {entry.n} {entry.noun[entry.n === 1 ? 0 : 1]}
              {i < COUNTS.length - 2 ? ", " : ""}
              {i === COUNTS.length - 2 ? " and " : ""}
            </span>
          ))}
        </h1>
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8">
        <div className="grid gap-x-14 gap-y-8 pt-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
              Juices go through the press on the morning they go out. Shakes are
              built to order. Nothing is made from concentrate and nothing is
              stretched with water. Add whatever you want below, or take the{" "}
              <Link
                href="/subscribe"
                className="text-gold underline underline-offset-2"
              >
                weekly subscription
              </Link>{" "}
              and stop thinking about it.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream-faint">
              Every item below carries its own ingredients, its own allergens
              and its own date. Nothing is summarised.
            </p>
          </div>

          <p className="border border-warn/40 bg-ink-card px-4 py-3.5 text-xs leading-relaxed text-cream-dim sm:text-sm lg:mt-1">
            <strong className="text-warn">Allergy or intolerance?</strong> The
            allergens shown on each item are our best reading of the recipe.
            They have not yet been confirmed against what actually goes in it.
            Read the full{" "}
            <Link
              href="/allergens"
              className="text-gold underline underline-offset-2"
            >
              allergen information
            </Link>{" "}
            before you order, and call{" "}
            <a
              href={`tel:${SOCIALS.phone}`}
              className="text-gold underline underline-offset-2"
            >
              {SOCIALS.phone}
            </a>{" "}
            or message us on Instagram first if you need to be certain.
          </p>
        </div>
      </div>

      {/* A hairline band rather than a boxed strip: the three numbers a person
          checks before they start filling a basket, sitting on one rule across
          the full width of the page. */}
      <div className="border-y border-ink-line bg-ink-raised">
        <dl className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px bg-ink-line sm:grid-cols-[1fr_1fr_1.4fr]">
          <div className="bg-ink-raised px-5 py-5 sm:px-8">
            <dt className="text-[0.6rem] uppercase tracking-label text-cream-faint">
              Minimum order
            </dt>
            <dd className="numeric mt-1.5 font-display text-xl text-gold-bright">
              {formatPrice(DELIVERY.minimumOrder)}
            </dd>
          </div>
          <div className="bg-ink-raised px-5 py-5 sm:px-8">
            <dt className="text-[0.6rem] uppercase tracking-label text-cream-faint">
              Free delivery over
            </dt>
            <dd className="numeric mt-1.5 font-display text-xl text-gold-bright">
              {formatPrice(DELIVERY.freeDeliveryThreshold)}
            </dd>
          </div>
          <div className="col-span-2 bg-ink-raised px-5 py-5 sm:col-span-1 sm:px-8">
            <dt className="text-[0.6rem] uppercase tracking-label text-cream-faint">
              Where and when
            </dt>
            <dd className="mt-1.5 font-display text-xl text-cream">
              Across {DELIVERY.city}, every{" "}
              <Link
                href="/delivery"
                className="text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
              >
                {DELIVERY.dropDay}
              </Link>
            </dd>
          </div>
        </dl>
      </div>

      <section className="mx-auto max-w-6xl px-5 pt-9 sm:px-8">
        <MenuSpotlight juices={products.filter((p) => p.category === "juice")} />
      </section>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="rule-foil my-9" />
      </div>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <MenuGrid products={products} />
      </section>
    </div>
  );
}
