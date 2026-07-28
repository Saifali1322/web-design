"use client";

import { useMemo, useState } from "react";
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

/** Fixed display order — matches the order categoryLabel is defined in. */
const CATEGORY_ORDER: Category[] = ["juice", "fuel", "bake"];

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
            </p>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <li key={product.id} className="flex flex-col">
                {/* ProductCard (owned by another agent) covers name, price,
                    tagline, image, size, keeps-days and add-to-basket. This
                    panel adds the two things it doesn't: the full recipe
                    description and the ingredients/allergens detail. */}
                <ProductCard product={product} />

                <div className="-mt-px flex flex-col gap-3 border border-t-0 border-ink-line bg-ink-raised px-5 py-4">
                  <h4 className="text-[0.62rem] uppercase tracking-label text-gold-dim">
                    More about this one
                  </h4>

                  <p className="text-sm leading-relaxed text-cream-dim">
                    {product.description}
                  </p>

                  <p className="text-xs leading-relaxed text-cream-faint">
                    <span className="text-cream-dim">Ingredients: </span>
                    {product.ingredients.join(", ")}
                  </p>

                  <AllergenBadgeList allergens={product.allergens} />
                </div>
              </li>
            ))}
          </ul>

          {/* Toppings are informational only — they are not added to the
              cart. The checkout API (src/app/api/checkout/route.ts) only
              accepts and prices `products` line items, so a topping picked
              here would ride along in the basket UI but never actually be
              charged. Until that API is extended to take a topping id per
              line, the honest thing is to tell people to name their topping
              in the order notes at checkout rather than pretend to sell it. */}
          {category === "bake" && (
            <section
              aria-labelledby="menu-toppings"
              className="flex flex-col gap-5 border border-ink-line bg-ink-raised px-5 py-6 sm:px-8"
            >
              <div>
                <h3
                  id="menu-toppings"
                  className="font-display text-xl text-gold-bright sm:text-2xl"
                >
                  Toppings — £1 extra
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-dim">
                  Add one to any Cartel Bake. Toppings aren&apos;t added to
                  the basket below — tell us which one you&apos;d like in
                  your order notes at checkout, or message us beforehand,
                  and we&apos;ll add it and take payment for it then.
                </p>
              </div>

              <ul className="grid gap-4 sm:grid-cols-3">
                {toppings.map((topping) => (
                  <li
                    key={topping.id}
                    className="flex flex-col gap-2.5 border border-ink-line bg-ink-card px-4 py-4"
                  >
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
          )}
        </section>
      ))}
    </div>
  );
}
