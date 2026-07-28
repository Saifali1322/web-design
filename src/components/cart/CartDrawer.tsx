"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DELIVERY, formatPrice, isInDeliveryArea } from "@/lib/catalogue";
import {
  MAX_LINE_QUANTITY,
  useCart,
  type CartItem,
} from "@/components/cart/CartProvider";
import CheckoutButton from "@/components/cart/CheckoutButton";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The basket, as a slide-over.
 *
 * Mounted once in the root layout and driven entirely by the cart provider,
 * which already owns Escape-to-close and the body scroll lock. This component
 * owns the postcode, because the postcode is only ever needed at checkout.
 */

const POSTCODE_KEY = "jc.postcode.v1";

export default function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    deliveryFee,
    total,
    belowMinimum,
    amountToMinimum,
    amountToFreeDelivery,
    isOpen,
    closeCart,
  } = useCart();

  const [postcode, setPostcode] = useState("");
  const [touched, setTouched] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  // Remember the postcode between visits — it never changes for most people.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(POSTCODE_KEY);
      if (saved) setPostcode(saved);
    } catch {
      // Private mode or blocked storage; the field just starts empty.
    }
  }, []);

  useEffect(() => {
    try {
      if (postcode.trim()) localStorage.setItem(POSTCODE_KEY, postcode);
    } catch {
      // Not worth surfacing.
    }
  }, [postcode]);

  // Move focus into the drawer when it opens so keyboard and screen-reader
  // users aren't left behind on the page underneath.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  const entered = postcode.trim().length > 0;
  const postcodeValid = entered && isInDeliveryArea(postcode);
  const showPostcodeError = touched && entered && !postcodeValid;
  const empty = items.length === 0;

  return (
    <div
      className={`fixed inset-0 z-[70] ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      {/* Backdrop. Click-to-close is a convenience for pointer users; keyboard
          users get the close button and Escape, so this stays out of the tab
          order rather than sitting in front of them as a giant unlabelled hit
          area. */}
      <div
        aria-hidden
        onClick={closeCart}
        className={`absolute inset-0 bg-ink/85 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isOpen ? true : undefined}
        aria-label="Your basket"
        tabIndex={-1}
        className={`absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-ink-line bg-ink-raised shadow-[var(--shadow-lift)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus:outline-none ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ---------- Header ---------- */}
        <header className="flex items-start justify-between gap-4 px-6 pb-5 pt-7">
          <div>
            <p className="text-xs uppercase tracking-label text-gold">
              Juice Cartel
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase tracking-wide">
              <span className="text-foil">Your Basket</span>
            </h2>
            <p className="mt-1 text-xs text-cream-faint">
              {count === 0
                ? "Empty"
                : `${count} item${count === 1 ? "" : "s"} · ${DELIVERY.city} delivery`}
            </p>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Close basket"
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-transparent text-cream-dim transition-colors hover:border-ink-line hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="rule-foil mx-6" />

        {/* ---------- Body ---------- */}
        {empty ? (
          <EmptyBasket onBrowse={closeCart} />
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain px-6">
            <ul className="divide-y divide-ink-line">
              {items.map((item) => (
                <BasketRow key={item.key} item={item} />
              ))}
            </ul>
          </div>
        )}

        {/* ---------- Footer ---------- */}
        {empty ? null : (
          <div className="border-t border-ink-line bg-ink px-6 pb-7 pt-5">
            {/* Nudges — the two numbers the cart already works out for us. */}
            {amountToMinimum > 0 ? (
              <p className="mb-4 border-l-2 border-warn bg-warn/[0.06] py-2.5 pl-3 text-sm leading-relaxed text-warn">
                Add <span className="numeric">{formatPrice(amountToMinimum)}</span>{" "}
                to reach the{" "}
                <span className="numeric">{formatPrice(DELIVERY.minimumOrder)}</span>{" "}
                minimum
              </p>
            ) : amountToFreeDelivery > 0 ? (
              <p className="mb-4 border-l-2 border-gold-deep bg-gold/[0.05] py-2.5 pl-3 text-sm leading-relaxed text-cream-dim">
                <span className="numeric text-gold">
                  {formatPrice(amountToFreeDelivery)}
                </span>{" "}
                more for free delivery
              </p>
            ) : (
              <p className="mb-4 border-l-2 border-gold bg-gold/[0.05] py-2.5 pl-3 text-sm leading-relaxed text-gold">
                Free delivery unlocked
              </p>
            )}

            {/* Totals */}
            <dl className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-cream-dim">Subtotal</dt>
                <dd className="numeric text-cream">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-cream-dim">Delivery</dt>
                <dd className="numeric text-cream">
                  {deliveryFee === 0 ? (
                    <span className="text-gold">Free</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </dd>
              </div>
              <div className="rule-foil my-3 opacity-60" />
              <div className="flex items-baseline justify-between">
                <dt className="text-xs uppercase tracking-label text-cream-faint">
                  Total
                </dt>
                <dd className="numeric font-display text-2xl text-foil">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>

            {/* Postcode */}
            <div className="mt-6">
              <label
                htmlFor={fieldId}
                className="mb-2 block text-xs uppercase tracking-label text-cream-dim"
              >
                Delivery postcode
              </label>
              <input
                id={fieldId}
                name="postcode"
                type="text"
                inputMode="text"
                autoComplete="postal-code"
                required
                placeholder="e.g. NG7 2RD"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={showPostcodeError}
                aria-describedby={showPostcodeError ? errorId : hintId}
                className={`numeric w-full border bg-ink-raised px-4 py-3 text-cream transition-colors placeholder:text-cream-faint focus:outline-none ${
                  showPostcodeError
                    ? "border-warn"
                    : "border-ink-line focus:border-gold"
                }`}
              />

              {showPostcodeError ? (
                <p
                  id={errorId}
                  role="alert"
                  className="mt-2 text-sm leading-relaxed text-warn"
                >
                  We don&rsquo;t deliver to that postcode yet — {DELIVERY.city}{" "}
                  only for now.
                </p>
              ) : (
                <p id={hintId} className="mt-2 text-xs leading-relaxed text-cream-faint">
                  {DELIVERY.city} only: {DELIVERY.postcodes.join(", ")}
                </p>
              )}
            </div>

            {/* Checkout */}
            <div className="mt-5">
              <CheckoutButton
                postcode={postcode}
                disabled={belowMinimum || !postcodeValid}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BasketRow({ item }: { item: CartItem }) {
  const { setQuantity, remove } = useCart();
  const { key, name, quantity, unitPrice, lineTotal } = item;

  // A blend has no catalogue entry, so everything shown here comes off the
  // blend itself — its mixed colour, and the pour that made it.
  const accent =
    item.kind === "blend" ? item.blend.accent : item.product.accent;
  const detail =
    item.kind === "blend"
      ? item.blend.composition
      : `${item.product.size} · ${formatPrice(unitPrice)} each`;

  return (
    <li className="flex gap-4 py-5">
      {/* Stand-in for photography: the item's own accent, quietly. */}
      <div
        className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-ink-line bg-ink-card"
        aria-hidden
      >
        <span
          className="absolute inset-0 opacity-25"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${accent}, transparent 70%)`,
          }}
        />
        <span className="relative font-display text-xl text-cream-dim">
          {item.kind === "blend" ? "＋" : item.product.name.charAt(0)}
        </span>
        <span
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ backgroundColor: accent }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base leading-snug text-cream">
              {name}
            </h3>
            {item.kind === "blend" ? (
              <p className="mt-0.5 text-xs uppercase tracking-label text-gold-deep">
                Your blend · 330ml
              </p>
            ) : null}
            <p className="mt-0.5 text-xs leading-relaxed text-cream-faint">
              {detail}
            </p>
            {item.kind === "blend" ? (
              <p className="mt-0.5 text-xs text-cream-faint">
                <span className="numeric">{formatPrice(unitPrice)}</span> each
              </p>
            ) : null}
          </div>
          <p className="numeric shrink-0 text-sm text-cream">
            {formatPrice(lineTotal)}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center border border-ink-line">
            <StepperButton
              label={`Decrease quantity of ${name}`}
              onClick={() => setQuantity(key, quantity - 1)}
            >
              <path d="M5 12h14" strokeLinecap="round" />
            </StepperButton>

            <span
              aria-live="polite"
              aria-label={`Quantity of ${name}`}
              className="numeric w-9 text-center text-sm text-cream"
            >
              {quantity}
            </span>

            <StepperButton
              label={`Increase quantity of ${name}`}
              onClick={() => setQuantity(key, quantity + 1)}
              disabled={quantity >= MAX_LINE_QUANTITY}
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </StepperButton>
          </div>

          <button
            type="button"
            onClick={() => remove(key)}
            aria-label={`Remove ${name} from basket`}
            className="text-xs uppercase tracking-label text-cream-faint transition-colors hover:text-warn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
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
      className="flex h-8 w-8 items-center justify-center text-cream-dim transition-colors hover:bg-ink-card hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold disabled:cursor-not-allowed disabled:text-cream-faint/40"
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

function EmptyBasket({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
      <p className="font-script text-4xl leading-none text-foil">Nothing yet</p>
      <p className="mt-5 text-sm leading-relaxed text-cream-dim">
        Your basket is empty. Everything is pressed the morning it goes out, and
        the mango tends to go first.
      </p>
      <ButtonLink href="/menu" variant="secondary" size="md" onClick={onBrowse} className="mt-8">
        Browse the menu
      </ButtonLink>
      <p className="mt-5 text-sm text-cream-dim">
        or{" "}
        <Link
          href="/mixer"
          onClick={onBrowse}
          className="text-gold underline underline-offset-2"
        >
          build your own blend
        </Link>
      </p>
      <p className="mt-6 text-xs text-cream-faint">
        Minimum order{" "}
        <span className="numeric">{formatPrice(DELIVERY.minimumOrder)}</span> ·
        Free delivery over{" "}
        <span className="numeric">
          {formatPrice(DELIVERY.freeDeliveryThreshold)}
        </span>
      </p>
    </div>
  );
}
