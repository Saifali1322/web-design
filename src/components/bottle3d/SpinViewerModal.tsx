"use client";

/**
 * The "Spin it" dialog.
 *
 * A modal rather than an inline panel, for two reasons that both matter more
 * than the extra tap:
 *
 *  1. Contexts. Seven juice cards on /menu would mean seven live WebGL
 *     contexts if the viewer were inline, and browsers start dropping the
 *     oldest at around sixteen. One modal means exactly one context, ever.
 *  2. Phones. A bottle is 2.6× taller than it is wide. Inline it would be a
 *     stamp inside a card; as a sheet it gets the full height of the screen,
 *     which is the only way a 330ml bottle reads as a 330ml bottle.
 *
 * Unmounting the dialog unmounts the scene, which is what triggers the
 * teardown in BottleScene — open and close is a full create/destroy cycle.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { formatPrice, type Product } from "@/lib/catalogue";
import Bottle3DViewer from "./Bottle3DViewer";

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export interface SpinViewerModalProps {
  product: Product;
  onClose: () => void;
}

export default function SpinViewerModal({
  product,
  onClose,
}: SpinViewerModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  /* Park focus in the dialog and put it back where it came from on close.
     No `mounted` guard: this only ever renders on the client, because SpinIt
     pulls it in through `next/dynamic({ ssr: false })` and only after a
     click — and a guard here would run this effect a render too early, with
     `closeRef` still empty. */
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  /* Escape on `document` rather than only on the panel: focus can legitimately
     sit outside the dialog's React tree (the canvas takes it on pointerdown,
     a browser find-bar can steal it) and Escape has to work regardless. */
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [onClose]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2000);
    return () => window.clearTimeout(t);
  }, [added]);

  /* Tab containment. Escape is handled on `document` above. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [],
  );

  const titleId = `spin-${product.id}-title`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Close the 3D viewer"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/85 backdrop-blur-sm"
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-rise relative flex h-[94dvh] w-full max-w-[460px] flex-col border border-ink-line bg-ink-raised shadow-lift sm:h-[min(88dvh,780px)]"
      >
        {/* Plain divs, not <header>/<footer>. Neither element is scoped by an
            ancestor with role="dialog", so inside the modal they map to a
            SECOND banner and a SECOND contentinfo landmark alongside the
            page's own — three axe violations that only appear while the
            viewer is open, which is why they had gone unnoticed. There is no
            landmark worth having here anyway; the dialog is the landmark. */}
        <div className="flex items-start justify-between gap-4 border-b border-ink-line px-5 py-4">
          <div className="min-w-0">
            <p className="tracking-label text-[0.625rem] uppercase text-gold">
              {product.size} · Cold pressed
            </p>
            <h2
              id={titleId}
              className="mt-1 truncate font-display text-2xl text-cream"
            >
              {product.name}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-ink-line text-cream-dim transition-colors hover:border-gold-deep hover:text-gold-bright"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
              />
            </svg>
          </button>
        </div>

        {/* The stage. `min-h-0` is what lets the flex child actually shrink so
            the canvas can own the leftover height instead of overflowing. */}
        {/* The gradient mirrors the WebGL backdrop, so the poster sits on the
            same ground the canvas will and the cross-fade has nothing to
            give away. */}
        <div className="relative min-h-0 flex-1 border-b border-ink-line bg-[radial-gradient(120%_92%_at_50%_36%,#3a2d1b_0%,#16120c_45%,#050403_100%)]">
          <Bottle3DViewer
            accent={product.accent}
            accentDeep={product.accentDeep}
            name={product.name}
            productId={product.id}
            seed={product.id.length + product.name.charCodeAt(0)}
          />
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="numeric font-display text-xl text-gold">
              {formatPrice(product.price)}
            </p>
            <p className="mt-0.5 truncate text-xs text-cream-faint">
              {product.tagline}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              add(product.id);
              setAdded(true);
            }}
          >
            {added ? "Added" : "Add to basket"}
          </Button>
        </div>

        <span aria-live="polite" className="sr-only">
          {added ? `${product.name} added to your basket` : ""}
        </span>
      </div>
    </div>,
    document.body,
  );
}
