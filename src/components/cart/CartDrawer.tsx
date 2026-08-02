"use client";

import { useEffect, useRef } from "react";
import { DELIVERY, formatPrice } from "@/lib/catalogue";
import { useCart } from "@/components/cart/CartProvider";
import BasketRow from "@/components/cart/BasketRow";
import CheckoutButton from "@/components/cart/CheckoutButton";
import DeliveryProgress from "@/components/cart/DeliveryProgress";
import EmptyBasket from "@/components/cart/EmptyBasket";
import PostcodeField from "@/components/cart/PostcodeField";
import { useDeliveryPostcode } from "@/components/subscribe/postcode";

/**
 * The basket, as a slide-over.
 *
 * Mounted once in the root layout and driven entirely by the cart provider,
 * which already owns Escape-to-close and the body scroll lock. This adds the
 * two things a modal owes a keyboard user: focus goes in when it opens and
 * comes back out to wherever it was when it closes, and Tab stays inside while
 * it is open.
 *
 * The postcode is shared with /delivery and /subscribe rather than owned here,
 * so somebody who checked their postcode before browsing is never asked twice.
 */

/** How long the undo offer stays up after a line is removed. */
const UNDO_TIMEOUT_MS = 12_000;

export default function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    deliveryFee,
    total,
    belowMinimum,
    hydrated,
    lastRemoved,
    isOpen,
    closeCart,
    undoRemove,
    dismissUndo,
  } = useCart();

  const { postcode, status: postcodeStatus } = useDeliveryPostcode();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Focus in on open, and back to the trigger on close — otherwise a keyboard
  // user who closes the basket lands at the top of the document.
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      // The close button, not the panel: it is the one control that always
      // exists, so Shift+Tab from it reaches the end of the drawer.
      closeRef.current?.focus();
      return;
    }
    returnFocusRef.current?.focus?.();
    returnFocusRef.current = null;
  }, [isOpen]);

  // Keep Tab inside the drawer while it is open.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen]);

  // The undo offer expires on its own; leaving it up for the rest of the
  // session turns a helpful line into a permanent piece of furniture.
  const removedKey = lastRemoved?.key;
  useEffect(() => {
    if (!removedKey) return;
    const timer = window.setTimeout(dismissUndo, UNDO_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [removedKey, dismissUndo]);

  const empty = items.length === 0;
  const canCheckout = !belowMinimum && postcodeStatus === "in";

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
        className={`absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-ink-line bg-ink-raised shadow-[var(--shadow-lift)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
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
            ref={closeRef}
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

        {/* Undo. Announced as well as shown — a line disappearing silently is
            the failure this is here to catch. */}
        {lastRemoved ? (
          <div
            role="status"
            aria-live="polite"
            className="mx-6 mt-4 flex items-center justify-between gap-3 border border-ink-line bg-ink px-4 py-2.5"
          >
            <p className="min-w-0 truncate text-xs text-cream-dim">
              Removed{" "}
              <span className="text-cream">{lastRemoved.name}</span>
            </p>
            <button
              type="button"
              onClick={undoRemove}
              className="shrink-0 text-[0.6875rem] uppercase tracking-label text-gold underline underline-offset-4 transition-colors hover:text-gold-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Undo
            </button>
          </div>
        ) : null}

        {/* ---------- Body ---------- */}
        {!hydrated ? (
          // One frame or two while localStorage is read. Showing the empty
          // state first would tell returning customers their basket was gone.
          <div className="flex-1" aria-hidden />
        ) : empty ? (
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
        {hydrated && !empty ? (
          <div className="border-t border-ink-line bg-ink px-6 pb-7 pt-5">
            <DeliveryProgress subtotal={subtotal} />

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

            <PostcodeField className="mt-5" />

            <div className="mt-5">
              <CheckoutButton
                postcode={postcode}
                blocked={
                  belowMinimum
                    ? "minimum"
                    : postcodeStatus === "in"
                      ? null
                      : "postcode"
                }
                disabled={!canCheckout}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
