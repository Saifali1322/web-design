"use client";

/**
 * One juice shown large, with the rest a click away.
 *
 * The grid below this is still the whole menu — every item, every detail,
 * for anyone who wants to see it all at once. This is the other way in:
 * pick a flavour, see it properly, add it, pick the next one. Small
 * catalogues are usually better served by this than by a supermarket-style
 * grid as the very first thing on the page, and it is also where the 3D
 * spinner gets to be the headline feature rather than a corner of a card.
 *
 * Juices only. Shakes and bakes don't have the 3D model behind them, and a
 * spotlight that sometimes has a "Spin it" button and sometimes doesn't
 * would read as broken rather than as a deliberate scope.
 */

import { useState } from "react";
import { FoilImage } from "@/components/ui/ProductCard";
import SpinIt from "@/components/bottle3d/SpinIt";
import { Button } from "@/components/ui/Button";
import { useAddToBasket } from "@/components/cart/useAddToBasket";
import { allergenLabel, formatPrice, type Product } from "@/lib/catalogue";
import { AllergenBadgeList } from "./AllergenBadge";

export interface MenuSpotlightProps {
  juices: Product[];
}

export default function MenuSpotlight({ juices }: MenuSpotlightProps) {
  const bestseller = juices.find((j) => j.bestseller) ?? juices[0];
  const [activeId, setActiveId] = useState(bestseller?.id);
  const { addProduct } = useAddToBasket();
  const [justAdded, setJustAdded] = useState(false);

  const active = juices.find((j) => j.id === activeId) ?? juices[0];
  if (!active) return null;

  const allergens = active.allergens.map((a) => allergenLabel[a]).join(", ");

  return (
    <section aria-labelledby="spotlight-heading" className="flex flex-col gap-6">
      <h2 id="spotlight-heading" className="sr-only">
        Quick browse
      </h2>

      <div className="grid gap-8 border border-ink-line bg-ink-card p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:p-10">
        <div className="relative mx-auto w-full max-w-[280px] lg:max-w-none">
          <div className="aspect-[4/5] w-full">
            <FoilImage
              src={`/products/${active.image}`}
              alt={`${active.name} — ${active.tagline}`}
              accent={active.accent}
              accentDeep={active.accentDeep}
              priority
              sizes="(max-width: 1023px) 70vw, 420px"
              className="h-full w-full"
              uid={`spotlight-${active.id}`}
              seed={active.id.length * 7}
            />
          </div>
          <SpinIt product={active} className="absolute bottom-3 left-3" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-3xl leading-tight text-foil sm:text-4xl">
              {active.name}
            </h3>
            <p className="numeric shrink-0 font-display text-2xl text-gold-bright">
              {formatPrice(active.price)}
            </p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-cream-dim sm:text-base">
            {active.tagline}
          </p>

          <div className="mt-5 mb-5 h-px bg-ink-line" />

          <p className="text-sm leading-relaxed text-cream-dim">
            {active.description}
          </p>

          <p className="mt-4 text-xs leading-relaxed text-cream-faint">
            <span className="text-cream-dim">Ingredients: </span>
            {active.ingredients.join(", ")}
          </p>

          <p className="numeric mt-3 text-2xs tracking-[0.1em] text-cream-faint uppercase">
            {active.size} · Keeps {active.keepsDays} days chilled
          </p>

          <div className="mt-3">
            <AllergenBadgeList allergens={active.allergens} />
          </div>

          <div className="mt-7">
            <Button
              variant={justAdded ? "primary" : "secondary"}
              size="lg"
              onClick={(event) => {
                addProduct(event.currentTarget, active.id, active);
                setJustAdded(true);
                window.setTimeout(() => setJustAdded(false), 2000);
              }}
            >
              {justAdded ? "Added" : "Add to basket"}
            </Button>
            <span aria-live="polite" className="sr-only">
              {justAdded ? `${active.name} added to your basket` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* The switcher. Same aria-pressed pattern as the homepage hero's
          flavour chips, so the interaction is already familiar by the time
          someone reaches this page. A colour swatch stands in for a thumbnail
          — at this size a photo reads as a smear, and the colour is the thing
          that actually distinguishes one bottle from the next at a glance. */}
      <div
        role="group"
        aria-label="Choose a juice to view"
        className="flex flex-wrap gap-2"
      >
        {juices.map((juice) => {
          const isActive = juice.id === active.id;
          return (
            <button
              key={juice.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveId(juice.id)}
              className={`flex items-center gap-2 border px-3.5 py-2 text-2xs font-medium uppercase tracking-label transition-colors ${
                isActive
                  ? "border-gold bg-gold/10 text-gold-bright"
                  : "border-ink-line text-cream-dim hover:border-gold-dim hover:text-gold"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: juice.accent }}
              />
              {juice.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
