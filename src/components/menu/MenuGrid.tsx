"use client";

import { useMemo, useState, type ReactNode } from "react";
import ProductCard from "@/components/ui/ProductCard";
import {
  categoryLabel,
  categoryNote,
  formatPrice,
  toppings,
  type Category,
  type Product,
} from "@/lib/catalogue";
import CategoryFilter, { type CategoryFilterValue } from "./CategoryFilter";
import { AllergenBadgeList } from "./AllergenBadge";

/** Fixed display order, matching the order categoryLabel is defined in. */
const CATEGORY_ORDER: Category[] = ["juice", "fuel", "bake"];

/**
 * Not every group wants the same grid.
 *
 * Seven juices and four shakes both leave a single card sitting alone at the
 * end of a three-up with two empty cells beside it, which reads as a bug. The
 * gap gets a note in it instead — a real one, about the thing the cards next
 * to it cannot say. Two bakes get two columns and the toppings panel takes the
 * third slot as a proper sibling column rather than another band underneath.
 */
const GRID: Record<Category, string> = {
  juice: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  fuel: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  bake: "grid gap-6 sm:grid-cols-2",
};

/**
 * The note that fills the trailing gap. Both are written off the catalogue, so
 * neither can end up claiming something the menu above it contradicts.
 */
function TailNote({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    /* self-end, not stretch: a note is not a card, and a note stretched to
       card height is four lines of type floating in 500px of nothing. It sits
       on the bottom edge of the row instead. */
    <li className="flex sm:col-span-2 sm:self-end">
      <div className="flex w-full flex-col border border-dashed border-gold-deep/50 bg-ink-card/60 px-6 py-7 sm:px-8">
        <h4 className="font-display text-lg text-gold-bright sm:text-xl">
          {title}
        </h4>
        <div className="mt-2.5 max-w-xl space-y-2 text-sm leading-relaxed text-cream-dim">
          {children}
        </div>
      </div>
    </li>
  );
}

function ProductItem({ product }: { product: Product }) {
  return (
    <li className="flex flex-col">
      {/* ProductCard (owned by another agent) covers name, price, tagline,
          image, size, keeps-days and add-to-basket. This panel adds the two
          things it doesn't: the full recipe description and the
          ingredients/allergens detail. */}
      <ProductCard product={product} />

      <div className="-mt-px flex flex-col gap-3 border border-t-0 border-ink-line bg-ink-raised px-5 py-4">
        {/* Allergens stay outside the disclosure and visible by default —
            this is food-safety information, not marketing copy, and it must
            not cost a click to see. Only the description and ingredient
            list, which is what actually made this grid read as a long
            scroll of prose instead of a fast shop grid, collapse.

            Native <details>, matching the FAQ page's own pattern exactly
            rather than a second bespoke toggle: keyboard-operable and
            announced to assistive tech with no ARIA wiring, and nothing to
            break under prefers-reduced-motion because nothing here animates
            beyond the FAQ's own chevron rotation. */}
        <AllergenBadgeList allergens={product.allergens} />

        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.62rem] uppercase tracking-label text-gold-dim marker:content-none">
            More about this one
            <span
              aria-hidden="true"
              className="shrink-0 text-sm leading-none text-gold transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>

          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-cream-dim">
              {product.description}
            </p>

            <p className="text-xs leading-relaxed text-cream-faint">
              <span className="text-cream-dim">Ingredients: </span>
              {product.ingredients.join(", ")}
            </p>
          </div>
        </details>
      </div>
    </li>
  );
}

/**
 * Toppings are informational only. They are not added to the cart: the
 * checkout API (src/app/api/checkout/route.ts) only accepts and prices
 * `products` line items, so a topping picked here would ride along in the
 * basket UI and never actually be charged. Until that API takes a topping id
 * per line, the honest thing is to ask people to name their topping in the
 * order notes rather than pretend to sell it.
 */
function Toppings() {
  const prices = toppings.map((t) => t.price);
  const flatPrice = Math.min(...prices) === Math.max(...prices);

  return (
    <section
      aria-labelledby="menu-toppings"
      className="flex flex-col gap-5 self-start border border-ink-line bg-ink-raised px-5 py-6 sm:px-7"
    >
      <div>
        <h3
          id="menu-toppings"
          className="font-display text-xl text-gold-bright sm:text-2xl"
        >
          Toppings
          {flatPrice ? `, ${formatPrice(Math.min(...prices))} each` : ""}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-cream-dim">
          One goes on any Cartel Bake. They are not in the basket yet, so put
          the one you want in your order notes at checkout or message us
          beforehand, and we&apos;ll add it and take payment for it then.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-ink-line border-y border-ink-line">
        {toppings.map((topping) => (
          <li key={topping.id} className="flex flex-col gap-2 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-base text-cream">
                {topping.name}
              </span>
              <span className="numeric shrink-0 text-sm text-gold">
                +{formatPrice(topping.price)}
              </span>
            </div>
            <AllergenBadgeList allergens={topping.allergens} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MenuGrid({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<CategoryFilterValue>("all");

  const presentCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => products.some((p) => p.category === c)),
    [products],
  );

  const groups = useMemo(
    () =>
      presentCategories
        .filter((c) => filter === "all" || filter === c)
        .map((category) => ({
          category,
          items: products.filter((p) => p.category === category),
        })),
    [presentCategories, products, filter],
  );

  const recordBake = products.find((p) => p.id === "matilda-crunch-cake");

  const juiceList = products.filter((p) => p.category === "juice");
  const seasonal = juiceList.filter((p) => p.seasonal);
  const dearest = juiceList.reduce<Product | undefined>(
    (a, b) => (!a || b.price > a.price ? b : a),
    undefined,
  );

  const fuelList = products.filter((p) => p.category === "fuel");
  const fuelKeeps = fuelList.length
    ? Math.min(...fuelList.map((p) => p.keepsDays))
    : 0;
  const juiceKeeps = juiceList.length
    ? Math.min(...juiceList.map((p) => p.keepsDays))
    : 0;

  return (
    <div className="flex flex-col gap-14">
      <CategoryFilter
        categories={presentCategories}
        selected={filter}
        onSelect={setFilter}
      />

      {groups.map(({ category, items }) => (
        <section
          key={category}
          aria-labelledby={`menu-cat-${category}`}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-5">
              <h2
                id={`menu-cat-${category}`}
                className="whitespace-nowrap font-display text-2xl text-foil sm:text-3xl"
              >
                {categoryLabel[category]}
              </h2>
              <div className="rule-foil flex-1" />
            </div>
            <p className="text-xs uppercase tracking-label text-cream-faint">
              {categoryNote[category]}
              {/* Signposts the viewer for anyone who reads the section header
                  before they read the cards. The button on each card is the
                  real affordance; this is just a nudge. */}
              {category === "juice" && (
                <span className="text-gold-dim"> · Spin any bottle in 3D</span>
              )}
            </p>

            {/* A line only somebody who runs this kitchen would put on a menu.
                Both halves are straight off the product itself. */}
            {category === "bake" && recordBake && (
              <p className="mt-2 max-w-md border-l border-gold-deep pl-4 text-sm leading-relaxed text-cream-dim">
                {recordBake.name}{" "}
                is the one that broke our record month. It is also the Ramadan
                bestseller.
              </p>
            )}
          </div>

          {category === "bake" ? (
            <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:gap-8">
              <ul className={GRID.bake}>
                {items.map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </ul>
              <Toppings />
            </div>
          ) : (
            <ul className={GRID[category]}>
              {items.map((product) => (
                <ProductItem key={product.id} product={product} />
              ))}

              {category === "juice" && dearest && (
                <TailNote title="Two things worth knowing">
                  <p>
                    {seasonal.length > 0 && (
                      <>
                        {seasonal.map((p) => p.name).join(" and ")}{" "}
                        {seasonal.length === 1 ? "comes" : "come"} off the list
                        the week the fruit stops being worth pressing, and{" "}
                        {seasonal.length === 1 ? "goes" : "go"} back on when it
                        is good again.{" "}
                      </>
                    )}
                    {dearest.name}{" "}
                    is {formatPrice(dearest.price)} because it takes a lot of
                    them to fill one bottle. There is no cleverer answer than
                    that.
                  </p>
                </TailNote>
              )}

              {category === "fuel" && fuelKeeps > 0 && (
                <TailNote title="Not juice, and not vegan">
                  <p>
                    Every shake on this list is built on milk and whey protein.
                    None of them are vegan, and they keep {fuelKeeps}{" "}
                    days rather than the {juiceKeeps}{" "}
                    a bottle of juice gets. Blended on the morning of the run
                    like everything else, so drink them first.
                  </p>
                </TailNote>
              )}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
