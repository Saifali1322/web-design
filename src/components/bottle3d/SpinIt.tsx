"use client";

/**
 * The "Spin it" affordance, and the only thing about the 3D viewer that ships
 * in the /menu bundle.
 *
 * Everything heavy hangs off two `import()` calls that share their specifiers
 * with the prefetch below, so hovering, focusing or first touching the button
 * starts downloading the renderer while the finger is still on its way to the
 * click. Nothing is downloaded for a visitor who never asks.
 *
 * Deliberately a filled, always-visible control rather than a hover reveal:
 * roughly all of this shop's traffic arrives from TikTok on a phone, and there
 * is no hover on a phone.
 */

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { Product } from "@/lib/catalogue";

const SpinViewerModal = dynamic(() => import("./SpinViewerModal"), {
  ssr: false,
  loading: () => null,
});

export interface SpinItProps {
  product: Product;
  className?: string;
}

export default function SpinIt({ product, className = "" }: SpinItProps) {
  const [open, setOpen] = useState(false);

  const warm = useCallback(() => {
    void import("./SpinViewerModal");
    void import("./BottleScene");
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onPointerEnter={warm}
        onFocus={warm}
        onTouchStart={warm}
        aria-haspopup="dialog"
        aria-label={`Spin the ${product.name} bottle in 3D`}
        className={`inline-flex items-center gap-2 rounded-[2px] border border-gold-deep/70 bg-ink/85 px-3 py-2 font-sans text-[0.625rem] uppercase tracking-label text-gold backdrop-blur-sm transition-colors duration-300 hover:border-gold hover:text-gold-bright ${className}`}
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
          {/* Most of a circle, with an arrowhead — the universal "rotate me". */}
          <path
            d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16.6 2.4v3.6H13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="[text-indent:0.22em]">Spin it</span>
      </button>

      {open ? (
        <SpinViewerModal product={product} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
