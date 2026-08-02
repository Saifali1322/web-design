"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import SpinIt from "@/components/bottle3d/SpinIt";
import BottleArt from "@/components/hero/BottleArt";
import { useCart } from "@/components/cart/CartProvider";
import {
  allergenLabel,
  categoryLabel,
  formatPrice,
  type Product,
} from "@/lib/catalogue";
import { Button } from "./Button";
import { useMotionEnv, useParallax } from "./motion";

/* -------------------------------------------------------------------------
 * FoilImage
 *
 * There is no photography in /public yet, and a 404 on an <img> is the
 * ugliest thing a site can show. So the gold wash and the drawn bottle are
 * not a "placeholder" that gets deleted later — they are the permanent floor
 * of the image slot. The photograph fades in on top once it loads, and if it
 * never loads (missing file, slow phone, blocked request) the slot still
 * shows the product, in the right colour, rather than an empty frame.
 *
 * Drop real files into /public/products and /public/brand and they appear
 * with no code change.
 *
 * Lives in this file because the card is its main consumer; lift it into its
 * own module if a third or fourth caller shows up.
 * ---------------------------------------------------------------------- */

export interface FoilImageProps {
  /** e.g. "/products/mango-juice.jpg" */
  src: string;
  alt: string;
  /** Product accent hex — tints the fallback so each slot reads as itself. */
  accent?: string;
  /** Second gradient stop — without it the fallback falls back to a single-colour wash. */
  accentDeep?: string;
  /** next/image sizes hint. Always pass one; these are all `fill` images. */
  sizes: string;
  priority?: boolean;
  /** Applied to the wrapper. Must establish a size (aspect ratio or height). */
  className?: string;
  /** Applied to the <Image> — hover transforms belong here. */
  imageClassName?: string;
  /** Namespaces the fallback bottle's gradient ids. Must be unique per card. */
  uid: string;
  /** Varies condensation between cards so a grid does not look stamped. */
  seed?: number;
  /** Total scroll-linked travel in px. 0, or a low-power device, disables it. */
  parallax?: number;
}

export function FoilImage({
  src,
  alt,
  accent = "#d4a63c",
  accentDeep = "#8a6015",
  sizes,
  priority = false,
  className = "",
  imageClassName = "",
  uid,
  seed = 1,
  parallax = 0,
}: FoilImageProps) {
  const [status, setStatus] = useState<"pending" | "loaded" | "failed">(
    "pending",
  );
  const mediaRef = useRef<HTMLDivElement>(null);
  const env = useMotionEnv();

  /* The subject drifts against its frame as the card crosses the viewport.
     The transform is written straight to the node by the shared document
     scroll engine — no state, no per-card loop, and nothing at all on a
     phone or a four-core machine. The wrapper is inset past the frame at top
     and bottom so the travel never exposes a seam. */
  useParallax(mediaRef, parallax, env.parallaxEnabled && parallax > 0);

  return (
    <div className={`relative overflow-hidden bg-ink-card ${className}`}>
      {/* Ground: warm black with the product's own two-tone colour bleeding
          in as a gradient, so the fallback reads as liquid/light rather
          than a flat tint. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(118% 88% at 50% 12%, ${accent}40 0%, ${accentDeep}26 46%, transparent 72%), linear-gradient(163deg, #191510 0%, #0c0a08 58%, #120f0b 100%)`,
        }}
      />
      {/* A single sheet of light across the slot, like foil catching a lamp. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(112deg,transparent_26%,rgba(243,218,139,0.08)_45%,transparent_63%)]"
      />

      {/* The subject. Everything that should move together on hover and on
          scroll is inside this one wrapper — before, the photograph scaled
          and the drawn bottle behind it stayed put, which read as two images
          rather than one. */}
      <div
        ref={mediaRef}
        className="absolute inset-x-0 -top-[3%] -bottom-[3%] [transition:scale_1200ms_var(--ease-out-quint)] group-hover:scale-[1.045]"
      >
        {/* Until a photograph exists, show the actual product — the bottle art
            filled with this juice's own colour — not a ghosted logo. A 20%
            opacity mark reads as a broken image slot, which is exactly what a
            grid of them looked like while /public/products was empty. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-end justify-center"
        >
          <BottleArt
            uid={`card-${uid}`}
            accent={accent}
            accentDeep={accentDeep}
            height="86%"
            width="auto"
            seed={seed}
            dropletCount={8}
            labelDetail="mark"
            arcs={false}
            className="drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
          />
        </div>

        {status !== "failed" && (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("failed")}
            className={`object-cover transition-opacity duration-1000 ease-out ${
              status === "loaded" ? "opacity-100" : "opacity-0"
            } ${imageClassName}`}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

/** Confirmation mark — draws itself on rather than appearing. */
function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="-ml-1 h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 8.4 6.4 12 13 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="tick-draw"
      />
    </svg>
  );
}

export interface ProductCardProps {
  product: Product;
  /** Set on above-the-fold cards only. */
  priority?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  priority = false,
  className = "",
}: ProductCardProps) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 2000);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const allergens = product.allergens.map((a) => allergenLabel[a]).join(", ");

  return (
    <article
      /* Lifts with light rather than by growing: it rises 3px, the border
         warms and a gold bloom appears beneath it. Scaling a card up on hover
         enlarges its type along with it, and blurry type is the thing that
         actually reads as cheap. focus-within gives a keyboard user exactly
         the same treatment as a mouse. */
      className={`group card-motion relative flex h-full flex-col rounded-[2px] border border-ink-line bg-ink-card hover:-translate-y-[3px] hover:border-gold-deep/70 hover:shadow-raise focus-within:-translate-y-[3px] focus-within:border-gold-deep/70 focus-within:shadow-raise ${className}`}
    >
      <div className="relative">
        <FoilImage
          src={`/products/${product.image}`}
          alt={`${product.name} — ${product.tagline}`}
          accent={product.accent}
          accentDeep={product.accentDeep}
          priority={priority}
          sizes="(max-width: 639px) 92vw, (max-width: 1023px) 44vw, 360px"
          className="aspect-[4/5] rounded-t-[2px]"
          uid={product.id}
          seed={product.id.length * 7 + product.name.length}
          parallax={12}
        />

        {/* Category, set as a label rather than a badge — no pills. */}
        <span className="pointer-events-none absolute left-0 top-4 bg-ink/80 py-1.5 pl-4 pr-3 font-sans text-2xs tracking-label text-gold uppercase backdrop-blur-sm">
          {categoryLabel[product.category]}
        </span>

        {/* 3D viewer, juices only. The model is the 330ml cold-press bottle;
            offering "spin it" on a protein shake or a tub of crunch cake would
            hand people the wrong product in three dimensions. */}
        {product.category === "juice" && (
          <SpinIt product={product} className="absolute bottom-3 left-3" />
        )}

        {(product.seasonal || product.bestseller) && (
          <div className="pointer-events-none absolute bottom-0 right-0 flex">
            {product.seasonal && (
              <span className="bg-ink/85 px-3 py-1.5 font-sans text-2xs tracking-label text-cream-dim uppercase backdrop-blur-sm">
                Seasonal
              </span>
            )}
            {product.bestseller && (
              <span className="bg-ink/85 px-3 py-1.5 font-sans text-2xs tracking-label text-gold-bright uppercase backdrop-blur-sm">
                Bestseller
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-xl leading-tight tracking-[0.02em] text-cream">
            {product.name}
          </h3>
          <p className="numeric shrink-0 font-display text-xl leading-tight text-gold">
            {formatPrice(product.price)}
          </p>
        </div>

        <p className="mt-2 text-sm leading-relaxed font-light text-cream-dim">
          {product.tagline}
        </p>

        <div className="mt-4 mb-4 h-px bg-ink-line" />

        {/* `size` is a spec line, not a volume — it reads "330ml" on a juice,
            "35g+ protein" on a shake and "Single tub" on a bake, so it is
            shown verbatim rather than assumed to be a measure. */}
        <p className="numeric text-label tracking-[0.1em] text-cream-faint uppercase">
          {product.size} · Keeps {product.keepsDays} days chilled
        </p>

        {/* Allergens are a legal requirement at the point of order, not a
            detail to bury on a product page. */}
        <p className="mt-1.5 min-h-[1.1rem] text-label leading-relaxed text-cream-faint">
          {allergens ? `Contains ${allergens.toLowerCase()}` : "No declared allergens"}
        </p>

        <div className="mt-5 flex-1" />

        {/* Confirmation is a state change on the control that was pressed: it
            fills with foil for two seconds and the tick draws on. A toast
            somewhere else on the page makes people hunt for what happened. */}
        <Button
          variant={justAdded ? "primary" : "secondary"}
          size="md"
          fullWidth
          onClick={() => {
            add(product.id);
            setJustAdded(true);
          }}
        >
          {justAdded ? (
            <>
              <Tick />
              Added
            </>
          ) : (
            "Add to basket"
          )}
        </Button>

        <span aria-live="polite" className="sr-only">
          {justAdded ? `${product.name} added to your basket` : ""}
        </span>
      </div>
    </article>
  );
}

export default ProductCard;
