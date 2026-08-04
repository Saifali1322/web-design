"use client";

/**
 * The "Spin it" trigger for a homepage bundle card. Same prefetch-on-intent
 * pattern as bottle3d/SpinIt: the modal and the renderer both hang off
 * `import()` so nothing downloads for a visitor who never asks, and hovering
 * or touching the button starts the fetch before the click lands.
 */

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { ResolvedBundle } from "@/lib/bundles";

const BundleSpinModal = dynamic(() => import("./BundleSpinModal"), {
  ssr: false,
  loading: () => null,
});

export interface BundleSpinItProps {
  bundle: ResolvedBundle;
  className?: string;
}

export default function BundleSpinIt({ bundle, className = "" }: BundleSpinItProps) {
  const [open, setOpen] = useState(false);

  const warm = useCallback(() => {
    void import("./BundleSpinModal");
    void import("@/components/bottle3d/BottleScene");
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
        aria-label={`Spin the ${bundle.name} bottle in 3D`}
        className={`inline-flex items-center gap-2 rounded-[2px] border border-gold-deep/70 bg-ink/85 px-3 py-2 font-sans text-[0.625rem] uppercase tracking-label text-gold backdrop-blur-sm transition-colors duration-300 hover:border-gold hover:text-gold-bright ${className}`}
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
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
        <BundleSpinModal bundle={bundle} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
