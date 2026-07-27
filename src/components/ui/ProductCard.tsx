"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BottleMark } from "@/components/brand/Logo";
import { useCart } from "@/components/cart/CartProvider";
import {
  allergenLabel,
  categoryLabel,
  formatPrice,
  type Product,
} from "@/lib/catalogue";
import { Button } from "./Button";

/* -------------------------------------------------------------------------
 * FoilImage
 *
 * There is no photography in /public yet, and a 404 on an <img> is the
 * ugliest thing a site can show. So the gold wash and bottle watermark are
 * not a "placeholder" that gets deleted later — they are the permanent floor
 * of the image slot. The photograph fades in on top once it loads, and if it
 * never loads (missing file, slow phone, blocked request) the slot still
 * looks designed.
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
  /** next/image sizes hint. Always pass one; these are all `fill` images. */
  sizes: string;
  priority?: boolean;
  /** Applied to the wrapper. Must establish a size (aspect ratio or height). */
  className?: string;
  /** Applied to the <Image> — hover transforms belong here. */
  imageClassName?: string;
  /** Width of the watermark bottle inside the slot. */
  markClassName?: string;
}

export function FoilImage({
  src,
  alt,
  accent = "#d4a63c",
  sizes,
  priority = false,
  className = "",
  imageClassName = "",
  markClassName = "w-[30%]",
}: FoilImageProps) {
  const [status, setStatus] = useState<"pending" | "loaded" | "failed">(
    "pending",
  );

  return (
    <div className={`relative overflow-hidden bg-ink-card ${className}`}>
      {/* Ground: warm black with the product's own colour bleeding in. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(118% 88% at 50% 12%, ${accent}33, transparent 62%), linear-gradient(163deg, #191510 0%, #0c0a08 58%, #120f0b 100%)`,
        }}
      />
      {/* A single sheet of light across the slot, like foil catching a lamp. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(112deg,transparent_26%,rgba(243,218,139,0.08)_45%,transparent_63%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <BottleMark className={`${markClassName} h-auto text-gold/20`} />
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
  );
}

/* ---------------------------------------------------------------------- */

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
      className={`group relative flex h-full flex-col rounded-[2px] border border-ink-line bg-ink-card transition-colors duration-500 hover:border-gold-deep/70 focus-within:border-gold-deep/70 ${className}`}
    >
      <div className="relative">
        <FoilImage
          src={`/products/${product.image}`}
          alt={`${product.name} — ${product.tagline}`}
          accent={product.accent}
          priority={priority}
          sizes="(max-width: 639px) 92vw, (max-width: 1023px) 44vw, 360px"
          className="aspect-[4/5] rounded-t-[2px]"
          imageClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
          markClassName="w-[26%]"
        />

        {/* Category, set as a label rather than a badge — no pills. */}
        <span className="pointer-events-none absolute left-0 top-4 bg-ink/80 py-1.5 pl-4 pr-3 font-sans text-[0.625rem] tracking-label text-gold uppercase backdrop-blur-sm">
          {categoryLabel[product.category]}
        </span>

        {product.bestseller && (
          <span className="pointer-events-none absolute bottom-0 right-0 bg-ink/85 px-3 py-1.5 font-sans text-[0.625rem] tracking-label text-gold-bright uppercase backdrop-blur-sm">
            Bestseller
          </span>
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

        <p className="numeric text-[0.6875rem] tracking-[0.1em] text-cream-faint uppercase">
          {product.size} · Keeps {product.keepsDays} days chilled
        </p>

        {/* Allergens are a legal requirement at the point of order, not a
            detail to bury on a product page. */}
        <p className="mt-1.5 min-h-[1.1rem] text-[0.6875rem] leading-relaxed text-cream-faint">
          {allergens ? `Contains ${allergens.toLowerCase()}` : "No declared allergens"}
        </p>

        <div className="mt-5 flex-1" />

        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => {
            add(product.id);
            setJustAdded(true);
          }}
        >
          {justAdded ? "Added" : "Add to basket"}
        </Button>

        <span aria-live="polite" className="sr-only">
          {justAdded ? `${product.name} added to your basket` : ""}
        </span>
      </div>
    </article>
  );
}

export default ProductCard;
