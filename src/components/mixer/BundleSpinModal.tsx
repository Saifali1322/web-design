"use client";

/**
 * The "Spin it" dialog for a homepage bundle preset.
 *
 * A sibling to bottle3d/SpinViewerModal rather than a shared component: that
 * modal is typed to a catalogue `Product` because every /menu card is one.
 * A bundle is not a product — it is a BlendComponent list — so this takes the
 * handful of fields the dialog actually needs (name, price, composition,
 * colour) and wires the add button to `addCustomBlend` instead of `add`. The
 * dialog chrome, focus handling and Bottle3DViewer usage are copied over
 * unchanged, so the two viewers behave identically to a customer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Bottle3DViewer from "@/components/bottle3d/Bottle3DViewer";
import { useAddToBasket } from "@/components/cart/useAddToBasket";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/catalogue";
import type { ResolvedBundle } from "@/lib/bundles";

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export interface BundleSpinModalProps {
  bundle: ResolvedBundle;
  onClose: () => void;
}

export default function BundleSpinModal({ bundle, onClose }: BundleSpinModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  const { addCustomBlend } = useAddToBasket();

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

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, []);

  const titleId = `spin-${bundle.id}-title`;

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
        <div className="flex items-start justify-between gap-4 border-b border-ink-line px-5 py-4">
          <div className="min-w-0">
            <p className="tracking-label text-[0.625rem] uppercase text-gold">
              330ml · Build a Blend
            </p>
            <h2
              id={titleId}
              className="mt-1 truncate font-display text-2xl text-cream"
            >
              {bundle.name}
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

        <div className="relative min-h-0 flex-1 border-b border-ink-line bg-[radial-gradient(120%_92%_at_50%_36%,#3a2d1b_0%,#16120c_45%,#050403_100%)]">
          <Bottle3DViewer
            accent={bundle.blend.accent}
            accentDeep={bundle.blend.accentDeep}
            name={bundle.name}
            seed={bundle.id.length + bundle.name.charCodeAt(0)}
          />
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="numeric font-display text-xl text-gold">
              {formatPrice(bundle.blend.price)}
            </p>
            <p className="mt-0.5 truncate text-xs text-cream-faint">
              {bundle.blend.composition}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={(event) => {
              const ok = addCustomBlend(
                event.currentTarget,
                bundle.components,
                bundle.name,
                bundle.blend,
              );
              if (ok) setAdded(true);
            }}
          >
            {added ? "Added" : "Add to basket"}
          </Button>
        </div>

        <span aria-live="polite" className="sr-only">
          {added ? `${bundle.name} added to your basket` : ""}
        </span>
      </div>
    </div>,
    document.body,
  );
}
