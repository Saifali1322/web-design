"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ui/ProductCard";
import { useCart } from "@/components/cart/CartProvider";
import {
  categoryLabel,
  formatPrice,
  type Category,
  type Product,
} from "@/lib/catalogue";
import CategoryFilter, { type CategoryFilterValue } from "./CategoryFilter";
import { AllergenBadgeList } from "./AllergenBadge";

/** Fixed display order — matches the order categoryLabel is defined in. */
const CATEGORY_ORDER: Category[] = ["juice", "shake", "dessert", "shot"];

export default function MenuGrid({ products }: { products: Product[] }) {
  const { add } = useCart();
  const [filter, setFilter] = useState<CategoryFilterValue>("all");
  const [justAdded, setJustAdded] = useState<string | null>(null);

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

  const handleAdd = (product: Product) => {
    add(product.id);
    setJustAdded(product.id);
    window.setTimeout(() => {
      setJustAdded((current) => (current === product.id ? null : current));
    }, 1800);
  };

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
          <div className="flex items-baseline gap-5">
            <h2
              id={`menu-cat-${category}`}
              className="whitespace-nowrap font-display text-2xl text-foil sm:text-3xl"
            >
              {categoryLabel[category]}
            </h2>
            <div className="rule-foil flex-1" />
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <li
                key={product.id}
                className="flex flex-col border border-ink-line bg-ink-card"
              >
                <ProductCard product={product} />

                <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
                  <div>
                    <h3 className="font-display text-lg text-cream">
                      {product.name}
                    </h3>
                    <p className="font-script text-lg leading-tight text-gold">
                      {product.tagline}
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-cream-dim">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-ink-line pt-3 text-xs uppercase tracking-label text-cream-faint">
                    <span>{product.size}</span>
                    <span className="numeric text-sm font-medium text-gold-bright">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-cream-faint">
                    <span className="text-cream-dim">Ingredients: </span>
                    {product.ingredients.join(", ")}
                  </p>

                  <AllergenBadgeList allergens={product.allergens} />

                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    className="numeric mt-2 flex items-center justify-center gap-2 border border-gold-dim/70 py-2.5 text-[0.68rem] font-medium uppercase tracking-label text-gold transition-colors hover:border-gold hover:bg-gold/10 focus-visible:bg-gold/10"
                  >
                    {justAdded === product.id
                      ? "Added to basket"
                      : `Add to basket — ${formatPrice(product.price)}`}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
