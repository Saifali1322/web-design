import type { Metadata } from "next";
import {
  products,
  toppings,
  formatPrice,
  type Allergen,
  allergenLabel,
  allergenOrder,
  SOCIALS,
} from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Allergen Information",
  description:
    "Full allergen matrix for every Juice Cartel product and topping, covering all 14 UK-regulated allergens. This information has not been confirmed against our recipes — call or message us before ordering if you have a severe allergy.",
};

/**
 * The 14 allergens UK food law (FIC / Natasha's Law) requires us to declare.
 *
 * Every one of the 14 is a real flag in src/lib/catalogue.ts, so a recipe
 * that starts using mustard or sulphites can be declared accurately instead
 * of sitting in an untracked column. Short labels are used as column heads
 * because the table is already wide; the full legal wording is in
 * `allergenLabel` and is read out to screen readers below.
 */
const COLUMN_LABEL: Partial<Record<Allergen, string>> = {
  gluten: "Cereals w/ Gluten",
  nuts: "Tree Nuts",
  soya: "Soybeans",
  sulphites: "Sulphites",
};

const OFFICIAL_ALLERGENS: { key: Allergen; label: string }[] =
  allergenOrder.map((key) => ({
    key,
    label: COLUMN_LABEL[key] ?? allergenLabel[key],
  }));

function cellValue(productAllergens: Allergen[], column: { key: Allergen }) {
  return productAllergens.includes(column.key) ? "Yes" : "No";
}

export default function AllergensPage() {
  return (
    <div className="bg-grain">
      {/* A legal and safety notice, not a design flourish. It sits above
          everything else on the page and is not styled to blend in. */}
      <div className="border-b-2 border-warn bg-warn/[0.09]">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <p className="tracking-label text-[0.65rem] uppercase text-warn">
            Read this before you order
          </p>
          <p className="mt-2 max-w-3xl text-base font-medium leading-relaxed text-cream sm:text-lg">
            The allergen information below is our best-effort reading of each
            product from its name and typical ingredients.{" "}
            <strong className="text-warn">
              It has not been confirmed against our actual recipes.
            </strong>
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
            If you have a food allergy or intolerance of any kind, do not rely
            on this page alone. Call us on{" "}
            <a
              href={`tel:${SOCIALS.phone}`}
              className="font-medium text-gold underline underline-offset-2"
            >
              {SOCIALS.phone}
            </a>{" "}
            or message{" "}
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold underline underline-offset-2"
            >
              {SOCIALS.handle}
            </a>{" "}
            on Instagram before you order. Every time, so we can confirm
            exactly what is safe for you.
          </p>
        </div>
      </div>

      {/* Title in a narrow left rail, prose in the column beside it. The page
          is a reference document, so it is set like one. */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-10 sm:px-8 sm:pt-16">
        <div className="grid gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
          <div>
            <p className="tracking-label text-xs uppercase text-gold">
              Allergen information
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-foil sm:text-5xl">
              All fourteen,
              <br />
              for every item
            </h1>
          </div>

          <div className="min-w-0">
            <p className="max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
              Food sold at a distance has to declare its allergens clearly,
              before the order and again with the delivery. This page is that
              declaration. It covers all fourteen allergens UK law makes us
              name, for every product and every topping.
            </p>
            <p className="mt-5 max-w-2xl border border-warn/40 bg-ink-card px-4 py-3.5 text-sm leading-relaxed text-cream">
              Everything is made in one kitchen that also handles{" "}
              <strong className="text-warn">milk, wheat, soya and nuts</strong>,
              on shared equipment. No amount of housekeeping makes that untrue,
              so nothing here is labelled free from anything. If you have a
              severe allergy, call{" "}
              <a
                href={`tel:${SOCIALS.phone}`}
                className="text-gold underline underline-offset-2"
              >
                {SOCIALS.phone}
              </a>{" "}
              or{" "}
              <a
                href={SOCIALS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline underline-offset-2"
              >
                message us before ordering
              </a>
              , and we&apos;ll talk it through properly.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="matrix"
        className="mx-auto max-w-7xl px-5 pb-10 sm:px-8"
      >
        <div className="border-t border-ink-line pt-8">
          <h2 id="matrix" className="font-display text-2xl text-foil sm:text-3xl">
            Full allergen matrix
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-dim">
            Every one of the fourteen is recorded per product rather than
            assumed, which is why the table is this wide. Scroll it sideways.
            Nothing is folded away or summarised.
          </p>
        </div>

        {/* The key sits on the table it explains, not four inches away from it.
            It used to be a sentence with two dashes in the middle, which is a
            harder thing to check a row against. */}
        <div className="mt-6 mb-3 flex flex-col gap-x-10 gap-y-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl text-xs leading-relaxed text-cream-faint">
            Toppings sit in their own block under the products. They are
            optional add-ons that change a bake&apos;s allergens rather than
            part of the recipe, so a plain bake can be nut-free and still pick
            up tree nuts the moment a Kinder Bueno goes on top.
          </p>

          <dl className="flex shrink-0 gap-x-7 text-xs leading-relaxed">
            <div>
              <dt className="font-semibold text-warn">Yes</dt>
              <dd className="text-cream-faint">In the recipe.</dd>
            </div>
            <div>
              <dt className="text-cream">No</dt>
              <dd className="text-cream-faint">Not used in it.</dd>
            </div>
          </dl>
        </div>

        <div className="overflow-x-auto border border-ink-line">
          <table className="w-full min-w-[1150px] border-collapse text-sm">
            <caption className="sr-only">
              Allergen matrix listing all 14 UK-regulated allergens against
              every Juice Cartel product and topping
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 border border-ink-line bg-ink-raised px-4 py-3 text-left text-xs uppercase tracking-label text-gold"
                >
                  Product
                </th>
                {OFFICIAL_ALLERGENS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="border border-ink-line bg-ink-raised px-3 py-3 text-center text-xs uppercase tracking-label text-gold"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => (
                <tr
                  key={product.id}
                  className={i % 2 === 0 ? "bg-ink-card" : "bg-ink"}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border border-ink-line px-4 py-3 text-left font-medium text-cream ${
                      i % 2 === 0 ? "bg-ink-card" : "bg-ink"
                    }`}
                  >
                    {product.name}
                    <span className="block text-xs font-normal text-cream-faint">
                      {product.size}
                    </span>
                  </th>
                  {OFFICIAL_ALLERGENS.map((col) => {
                    const value = cellValue(product.allergens, col);
                    return (
                      <td
                        key={col.key}
                        className={`numeric border border-ink-line px-3 py-3 text-center ${
                          value === "Yes"
                            ? "font-semibold text-warn"
                            : "text-cream-faint"
                        }`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/* Toppings get their own <tbody>, visually broken out with a
                spanning heading row — a topping is not a menu item on its
                own, but it changes the allergens of whatever bake it goes
                on, so it cannot just be folded into the product rows above. */}
            <tbody>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={OFFICIAL_ALLERGENS.length + 1}
                  className="sticky left-0 z-10 border border-ink-line bg-gold/10 px-4 py-2.5 text-left text-xs uppercase tracking-label text-gold-bright"
                >
                  Toppings · £1 extra on any Cartel Bake. These allergens come
                  on top of whatever the bake already contains
                </th>
              </tr>
              {toppings.map((topping, i) => (
                <tr
                  key={topping.id}
                  className={i % 2 === 0 ? "bg-ink-card" : "bg-ink"}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border border-ink-line px-4 py-3 text-left font-medium text-cream ${
                      i % 2 === 0 ? "bg-ink-card" : "bg-ink"
                    }`}
                  >
                    {topping.name}
                    <span className="block text-xs font-normal text-cream-faint">
                      Topping · +{formatPrice(topping.price)}
                    </span>
                  </th>
                  {OFFICIAL_ALLERGENS.map((col) => {
                    const value = cellValue(topping.allergens, col);
                    return (
                      <td
                        key={col.key}
                        className={`numeric border border-ink-line px-3 py-3 text-center ${
                          value === "Yes"
                            ? "font-semibold text-warn"
                            : "text-cream-faint"
                        }`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* The two things the table cannot say for itself, side by side on a
          different ground so the page does not end on another white band of
          prose at the same width as the last four. */}
      <section
        aria-labelledby="afterwards"
        className="mt-6 border-y border-ink-line bg-ink-raised"
      >
        <h2 id="afterwards" className="sr-only">
          What the table does not cover
        </h2>
        <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h3
              id="cross-contamination"
              className="scroll-mt-28 font-display text-2xl text-foil sm:text-[1.75rem]"
            >
              Cross-contamination
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
              Everything is made in a single shared kitchen that also handles
              milk, wheat, soya and nuts, on shared equipment and shared
              surfaces. We clean thoroughly between batches. We still cannot
              promise total separation, so no item here is labelled free from
              anything. What the matrix lists is what each recipe is made with.
              It is not a guarantee against the kitchen around it.
            </p>
          </div>

          <div className="border-t border-ink-line pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-14">
            <h3
              id="severe-allergy"
              className="scroll-mt-28 font-display text-2xl text-foil sm:text-[1.75rem]"
            >
              Got a severe allergy?
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-cream-dim sm:text-base">
              Talk to us before you order rather than after. Tell us what you
              need to avoid and we&apos;ll tell you honestly whether we can
              make something safe for you. If the answer is no, you will get a
              no.
            </p>
            <a
              href={`tel:${SOCIALS.phone}`}
              className="numeric mt-5 block font-display text-2xl text-gold transition-colors hover:text-gold-bright"
            >
              {SOCIALS.phone}
            </a>
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-gold underline underline-offset-4 transition-colors hover:text-gold-bright"
            >
              {SOCIALS.handle}{" "}
              on Instagram
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
