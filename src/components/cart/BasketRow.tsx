"use client";

import { useEffect, useState } from "react";
import BottleArt, { VB_H, VB_W } from "@/components/hero/BottleArt";
import { FoilImage } from "@/components/ui/ProductCard";
import { allergenLabel, formatPrice } from "@/lib/catalogue";
import {
  MAX_LINE_QUANTITY,
  useCart,
  type CartItem,
} from "@/components/cart/CartProvider";

/**
 * One line of the basket.
 *
 * A catalogue product shows its photograph (or the designed fallback the rest
 * of the site uses). A blend has no photograph and never will, so it shows the
 * bottle art filled with its own mixed colour, and — more importantly — what
 * is actually in it: the pour, part by part, and where the price came from.
 * Somebody who built "Sunrise" three days ago should not have to open the
 * mixer to remember what they put in it.
 */

export default function BasketRow({ item }: { item: CartItem }) {
  const { setQuantity, remove } = useCart();
  const { key, name, quantity, unitPrice, lineTotal } = item;

  return (
    <li className="flex gap-4 py-5">
      <Thumbnail item={item} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-base leading-snug text-cream">
              {name}
            </h3>
            <p className="mt-0.5 text-[0.6875rem] uppercase tracking-label text-gold-deep">
              {item.kind === "blend"
                ? "Your blend · 330ml"
                : item.product.size}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="numeric text-sm text-cream">
              {formatPrice(lineTotal)}
            </p>
            {quantity > 1 ? (
              <p className="numeric mt-0.5 text-[0.6875rem] text-cream-faint">
                {formatPrice(unitPrice)} each
              </p>
            ) : null}
          </div>
        </div>

        {item.kind === "blend" ? (
          <BlendDetail item={item} />
        ) : (
          <p className="mt-1.5 text-xs leading-relaxed text-cream-faint">
            {item.product.tagline} ·{" "}
            <span className="numeric">{formatPrice(unitPrice)}</span> each
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <QuantityStepper
            label={name}
            quantity={quantity}
            onChange={(next) => setQuantity(key, next)}
          />

          <button
            type="button"
            onClick={() => remove(key)}
            aria-label={`Remove ${name} from basket`}
            className="text-[0.6875rem] uppercase tracking-label text-cream-faint transition-colors hover:text-warn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */

function Thumbnail({ item }: { item: CartItem }) {
  if (item.kind === "blend") {
    return (
      <div
        aria-hidden
        className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden border border-ink-line bg-ink-card"
      >
        <span
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${item.blend.accent}, transparent 72%)`,
          }}
        />
        {/* Sized off the art's own viewBox, like the mixer preview, so the
            bottle can be redrawn without leaving this box the wrong shape. */}
        <div
          className="relative h-[86%]"
          style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
        >
          <BottleArt
            uid={`basket-${item.key}`}
            accent={item.blend.accent}
            accentDeep={item.blend.accentDeep}
            width="100%"
            seed={item.blend.code.length * 5}
            dropletCount={0}
            labelDetail="mark"
            arcs={false}
          />
        </div>
      </div>
    );
  }

  return (
    <FoilImage
      src={`/products/${item.product.image}`}
      alt=""
      accent={item.product.accent}
      accentDeep={item.product.accentDeep}
      sizes="64px"
      uid={`basket-${item.product.id}`}
      seed={item.product.id.length * 7}
      className="h-20 w-16 shrink-0 border border-ink-line"
    />
  );
}

/**
 * What is in the bottle, and what it cost. The parts are the pour sheet the
 * kitchen works from, so they are shown in the same words the mixer used.
 */
function BlendDetail({ item }: { item: Extract<CartItem, { kind: "blend" }> }) {
  const { blend, unitPrice } = item;

  return (
    <div className="mt-2">
      <ul className="flex flex-wrap gap-1.5">
        {blend.components.map((component) => (
          <li
            key={component.product.id}
            className="inline-flex items-center gap-1.5 border border-ink-line bg-ink px-2 py-1 text-[0.6875rem] text-cream-dim"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0"
              style={{ backgroundColor: component.product.accent }}
            />
            <span className="numeric">{component.parts}</span>
            <span>
              part{component.parts === 1 ? "" : "s"}{" "}
              {component.product.shortName ?? component.product.name}
            </span>
          </li>
        ))}
      </ul>

      <p className="numeric mt-2 text-[0.6875rem] leading-relaxed text-cream-faint">
        {formatPrice(unitPrice)} each ={" "}
        {formatPrice(blend.pricing.ingredients)} juice +{" "}
        {formatPrice(blend.pricing.premium)} pressed to order
      </p>

      {/* Allergens follow the mix, so a blend containing a milk-based juice
          declares it here as well as on the pack. */}
      {blend.allergens.length > 0 ? (
        <p className="mt-1 text-[0.6875rem] leading-relaxed text-warn">
          Contains{" "}
          {blend.allergens.map((a) => allergenLabel[a].toLowerCase()).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Quantity, editable two ways: the steppers for one more, the field for "make
 * it six". Typing is why the field is a real input rather than a number
 * display — six taps of a plus button to buy a case is a tax on the best
 * customers.
 */
function QuantityStepper({
  label,
  quantity,
  onChange,
}: {
  label: string;
  quantity: number;
  onChange: (next: number) => void;
}) {
  // Local draft so the field can be empty mid-edit without the line vanishing.
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(quantity));
      return;
    }
    // 0 is a legitimate answer: it removes the line, with the same undo.
    onChange(Math.min(Math.max(parsed, 0), MAX_LINE_QUANTITY));
  };

  return (
    <div className="inline-flex items-center border border-ink-line">
      <StepperButton
        label={`Decrease quantity of ${label}`}
        onClick={() => onChange(quantity - 1)}
      >
        <path d="M5 12h14" strokeLinecap="round" />
      </StepperButton>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={draft}
        aria-label={`Quantity of ${label}`}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        className="numeric w-9 border-x border-ink-line bg-transparent py-1.5 text-center text-sm text-cream focus:outline-none focus-visible:bg-ink-card"
      />

      <StepperButton
        label={`Increase quantity of ${label}`}
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_LINE_QUANTITY}
      >
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </StepperButton>
    </div>
  );
}

function StepperButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center text-cream-dim transition-colors hover:bg-ink-card hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold disabled:cursor-not-allowed disabled:text-cream-faint/40"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
