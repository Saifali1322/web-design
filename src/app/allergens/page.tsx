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
      {/* Prominent, full-width — this is a legal and safety notice, not a
          design flourish, so it sits above everything else on the page and
          is not styled to blend in. */}
      <div className="border-b-2 border-warn bg-warn/[0.09]">
        <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
          <p className="tracking-label text-[0.65rem] uppercase text-warn">
            Read this before you order
          </p>
          <p className="mt-2 text-base font-medium leading-relaxed text-cream sm:text-lg">
            The allergen information below is our best-effort reading of each
            product from its name and typical ingredients.{" "}
            <strong className="text-warn">
              It has not been confirmed against our actual recipes.
            </strong>
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
            If you have a food allergy or intolerance of any kind, do not
            rely on this page alone. Call us on{" "}
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
            on Instagram before you order, every time, so we can confirm
            exactly what is safe for you.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-4xl px-5 pb-8 pt-10 sm:px-8 sm:pt-14">
        <p className="tracking-label text-xs uppercase text-gold">
          Allergen Information
        </p>
        <h1 className="mt-3 font-display text-4xl text-foil sm:text-5xl">
          Know exactly what&apos;s in it
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
          Food sold at a distance has to declare allergen information clearly,
          before and at delivery — this page is that declaration, not
          decoration. It covers all 14 allergens UK law requires us to name,
          for every product and topping we make.
        </p>
        <p className="mt-4 max-w-2xl border border-warn/40 bg-ink-card px-4 py-3 text-sm leading-relaxed text-cream">
          Everything is made in one kitchen that also handles{" "}
          <strong className="text-warn">milk, wheat, soya and nuts</strong>.
          Despite our best housekeeping, we cannot guarantee any item is
          completely free from traces of these. If you have a severe allergy
          or intolerance, call{" "}
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
          </a>{" "}
          so we can talk it through properly.
        </p>
      </section>

      <section aria-labelledby="matrix" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <h2 id="matrix" className="mb-2 font-display text-2xl text-foil sm:text-3xl">
          Full allergen matrix
        </h2>
        <p className="mb-2 max-w-3xl text-sm leading-relaxed text-cream-dim">
          <span className="text-cream">Yes</span> — contains this allergen as
          an ingredient. <span className="text-cream">No</span> — not used in
          this recipe. All 14 allergens named in UK law are listed, and each is
          recorded per product rather than assumed.
        </p>
        <p className="mb-2 max-w-3xl text-xs text-cream-faint">
          Toppings are listed separately below the products, since they are
          optional add-ons that change a bake&apos;s allergens rather than
          being part of the recipe itself — a plain bake can be nut-free and
          still pick up tree nuts the moment Kinder Bueno is added.
        </p>
        <p className="mb-6 max-w-3xl text-xs text-cream-faint">
          Scroll sideways to see every allergen — the table is wide by design
          so nothing is folded away or summarised.
        </p>

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
                  Toppings · £1 extra, added to any Cartel Bake — these
                  allergens are in addition to the bake itself
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

      <section
        aria-labelledby="cross-contamination"
        className="mx-auto max-w-4xl px-5 py-10 sm:px-8"
      >
        <h2
          id="cross-contamination"
          className="mb-3 font-display text-2xl text-foil sm:text-3xl"
        >
          Cross-contamination
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-cream-dim">
          Every product is made in a single shared kitchen that also handles
          milk, wheat, soya and nuts, using shared equipment and surfaces.
          We clean thoroughly between batches, but we cannot promise total
          separation, so we cannot label any item as completely free from any
          allergen. The matrix above lists what each recipe is made with —
          not a guarantee against traces from the kitchen around it.
        </p>
      </section>

      <section
        aria-labelledby="severe-allergy"
        className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-8"
      >
        <div className="rule-foil mb-8" />
        <h2
          id="severe-allergy"
          className="mb-3 font-display text-2xl text-foil sm:text-3xl"
        >
          Got a severe allergy?
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-cream-dim">
          Please talk to us before you order rather than after. Call{" "}
          <a
            href={`tel:${SOCIALS.phone}`}
            className="text-gold underline underline-offset-2"
          >
            {SOCIALS.phone}
          </a>{" "}
          or message{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2"
          >
            {SOCIALS.handle}
          </a>{" "}
          on Instagram with what you need to avoid, and we&apos;ll tell you
          honestly whether we can make something safe for you — and say so
          plainly if we can&apos;t.
        </p>
      </section>
    </div>
  );
}
