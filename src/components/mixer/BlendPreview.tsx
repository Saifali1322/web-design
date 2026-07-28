"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import BottleArt from "@/components/hero/BottleArt";
import { allergenLabel, formatPrice } from "@/lib/catalogue";
import {
  componentName,
  PRICE_STEP,
  type Blend,
} from "@/lib/blend";

/**
 * The live bottle, and the arithmetic behind the price.
 *
 * The maths is shown in full on purpose. A blend built mostly of pomegranate
 * costs more than one built mostly of orange, and the fastest way to look like
 * you are inventing numbers is to hide the sum that produced them.
 */

/** Empty glass, so an unstarted blend reads as empty rather than broken. */
const EMPTY_ACCENT = "#2b241a";
const EMPTY_ACCENT_DEEP = "#15110c";

/**
 * Always two decimals, for figures that sit in the aligned column of the sum.
 *
 * `formatPrice` drops a trailing ".00" — right for prose ("£12 minimum") but
 * wrong here, where a bare "£1" next to "£3.80" and "£4.80" reads as a typo
 * rather than a price. Prose in this file still uses `formatPrice`.
 */
const money = (pence: number): string => `£${(pence / 100).toFixed(2)}`;

export interface BlendPreviewProps {
  blend: Blend | null;
  name: string;
  /** Action slot — the desktop add-to-basket button lives here. */
  children?: ReactNode;
}

export default function BlendPreview({
  blend,
  name,
  children,
}: BlendPreviewProps) {
  const accent = blend?.accent ?? EMPTY_ACCENT;
  const accentDeep = blend?.accentDeep ?? EMPTY_ACCENT_DEEP;

  return (
    <div className="border border-ink-line bg-ink-raised p-5 sm:p-6">
      <div className="flex items-center gap-5 lg:block">
        <div className="relative shrink-0 lg:mx-auto">
          {/* Halo picks up the mixed colour, so the whole panel shifts with it. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 blur-2xl transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${accent}, transparent 70%)`,
              opacity: blend ? 0.32 : 0.1,
            }}
          />
          <div className="aspect-[200/520] w-[5.5rem] sm:w-24 lg:w-36">
            <BottleArt
              uid="mixer-preview"
              accent={accent}
              accentDeep={accentDeep}
              width="100%"
              seed={7}
              dropletCount={10}
              arcs={false}
              title={blend ? `${name} — live preview` : "Empty bottle"}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:mt-6 lg:text-center">
          <p className="text-xs uppercase tracking-label text-gold">
            Your blend
          </p>
          <p className="mt-1.5 break-words font-display text-xl leading-tight text-cream lg:text-2xl">
            {blend ? name : "Nothing in it yet"}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-cream-dim">
            {blend ? blend.composition : "Pick a juice to start."}
          </p>
          {blend ? (
            <p className="numeric mt-3 font-display text-3xl text-foil">
              {formatPrice(blend.price)}
            </p>
          ) : null}
        </div>
      </div>

      {blend ? (
        <>
          <div className="rule-foil my-5" />

          {/* ---- the sum ---- */}
          <h3 className="text-xs uppercase tracking-label text-cream-faint">
            How that price is worked out
          </h3>

          <dl className="mt-3 space-y-1.5 text-sm">
            {blend.components.map((c) => (
              <div
                key={c.product.id}
                className="flex items-baseline justify-between gap-3"
              >
                <dt className="min-w-0 text-cream-dim">
                  {c.parts} part{c.parts === 1 ? "" : "s"}{" "}
                  {componentName(c.product)}
                  <span className="numeric mt-0.5 block text-xs text-cream-faint">
                    {formatPrice(c.product.price)} a bottle
                  </span>
                </dt>
                <dd className="numeric shrink-0 text-cream">
                  {money(c.product.price * c.parts)}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 border-l-2 border-ink-line pl-3 text-xs leading-relaxed text-cream-faint">
            <span className="numeric">
              {formatPrice(blend.pricing.weightedTotal)}
            </span>{" "}
            across{" "}
            <span className="numeric">
              {blend.pricing.totalParts} part
              {blend.pricing.totalParts === 1 ? "" : "s"}
            </span>{" "}
            ={" "}
            <span className="numeric text-cream-dim">
              {formatPrice(blend.pricing.ingredients)}
            </span>{" "}
            a bottle, rounded up to the nearest {PRICE_STEP}p so a blend never
            costs less than the juice in it.
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-cream-dim">Ingredients</dt>
              <dd className="numeric text-cream">
                {money(blend.pricing.ingredients)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-cream-dim">
                Bespoke blend
                <span className="mt-0.5 block text-xs leading-relaxed text-cream-faint">
                  Pressed on its own, not as part of a batch.
                </span>
              </dt>
              <dd className="numeric text-cream">
                {money(blend.pricing.premium)}
              </dd>
            </div>
            <div className="rule-foil my-3 opacity-60" />
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs uppercase tracking-label text-cream-faint">
                Per bottle
              </dt>
              <dd className="numeric font-display text-2xl text-foil">
                {money(blend.price)}
              </dd>
            </div>
          </dl>

          {/* One juice on its own is not a blend — it is that juice with the
              bespoke charge on top. Say so plainly. A customer who works that
              out for themselves after paying does not order again, and the
              nudge costs us nothing when they genuinely want it pressed fresh. */}
          {blend.components.length === 1 ? (
            <p className="mt-4 border border-gold/30 bg-gold/[0.06] px-3 py-2.5 text-left text-xs leading-relaxed text-cream-dim">
              That is just our{" "}
              <span className="text-cream">
                {blend.components[0].product.name}
              </span>{" "}
              with the bespoke charge on top.{" "}
              <Link
                href="/menu"
                className="text-gold underline underline-offset-2"
              >
                Buy it from the menu for{" "}
                {formatPrice(blend.components[0].product.price)}
              </Link>{" "}
              instead, or add a second juice to make it properly yours.
            </p>
          ) : null}

          {/* ---- what's in it ---- */}
          <div className="mt-5 border-t border-ink-line pt-4 text-xs leading-relaxed">
            <p className="text-cream-dim">
              <span className="text-cream">Ingredients:</span>{" "}
              {blend.ingredients.join(", ")}
            </p>
            <p className="mt-1.5 text-cream-dim">
              <span className="text-cream">Allergens:</span>{" "}
              {blend.allergens.length === 0
                ? "none declared in these juices"
                : blend.allergens.map((a) => allergenLabel[a]).join(", ")}
            </p>
          </div>

          {children}
        </>
      ) : null}
    </div>
  );
}
