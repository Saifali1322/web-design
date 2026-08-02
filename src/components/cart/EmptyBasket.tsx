"use client";

import Link from "next/link";
import { DELIVERY, formatPrice, products } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The empty basket.
 *
 * An empty drawer is the one screen where a shop has someone's full attention
 * and nothing to lose, so it does not just apologise and point at the menu —
 * it offers the three things that actually sell, one tap each, without
 * leaving the drawer. Closing the basket to go and find something is the
 * step most people don't come back from.
 */

/** The bestsellers, in catalogue order. Marked in one place, in catalogue.ts. */
const picks = products.filter((p) => p.bestseller).slice(0, 3);

export default function EmptyBasket({ onBrowse }: { onBrowse: () => void }) {
  const { add } = useCart();

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8">
      <div className="pt-10 text-center">
        <p className="font-script text-4xl leading-none text-foil">
          Nothing yet
        </p>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-cream-dim">
          Everything is pressed the morning it goes out. These three go first.
        </p>
      </div>

      <ul className="mt-8 divide-y divide-ink-line border-y border-ink-line">
        {picks.map((product) => (
          <li
            key={product.id}
            className="flex items-center gap-3 py-3.5"
          >
            <span
              aria-hidden
              className="h-9 w-9 shrink-0 border border-ink-line"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${product.accent}, ${product.accentDeep} 78%)`,
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base text-cream">
                {product.name}
              </p>
              <p className="truncate text-xs text-cream-faint">
                {product.tagline}
              </p>
            </div>
            <span className="numeric shrink-0 text-sm text-gold">
              {formatPrice(product.price)}
            </span>
            <button
              type="button"
              onClick={() => add(product.id)}
              className="shrink-0 border border-gold-deep/70 px-3 py-2 text-[0.625rem] uppercase tracking-label text-gold transition-colors hover:border-gold hover:bg-gold/10 hover:text-gold-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Add
              <span className="sr-only"> {product.name} to basket</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-center">
        <ButtonLink
          href="/menu"
          variant="secondary"
          size="md"
          fullWidth
          onClick={onBrowse}
        >
          See the full menu
        </ButtonLink>
        <p className="mt-4 text-sm text-cream-dim">
          or{" "}
          <Link
            href="/mixer"
            onClick={onBrowse}
            className="text-gold underline underline-offset-2"
          >
            build your own blend
          </Link>
        </p>
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-cream-faint">
        {DELIVERY.city} delivery every {DELIVERY.dropDay}. Minimum order{" "}
        <span className="numeric">{formatPrice(DELIVERY.minimumOrder)}</span>,
        free over{" "}
        <span className="numeric">
          {formatPrice(DELIVERY.freeDeliveryThreshold)}
        </span>
        .
      </p>
    </div>
  );
}
