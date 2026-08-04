"use client";

/**
 * The "Build a Blend" beat.
 *
 * Every other DTC juice site with a build-your-own flow does it the same way:
 * pick a pack size, then fill it from a grid of plain product photos. None of
 * the sites this was benchmarked against (Raw Generation, Raw Juicery, Juice
 * From The Raw, PUR) let a customer actually look at what they are building —
 * it is a list of names and a running total. This site already has a bottle
 * that spins in 3D and mixes colour in OKLab; the one thing missing was
 * putting that in front of someone before they have found /mixer on their
 * own. Three ready-made bundles do that: a real blend, a real price, and the
 * same "Spin it" control the menu cards use, right on the homepage.
 *
 * Deliberately not the full picker — that is what /mixer is for, and it is
 * three times this tall. This is the shop window, not the workshop.
 */

import { useEffect, useState } from "react";
import BottleArt, { VB_H, VB_W } from "@/components/hero/BottleArt";
import BundleSpinIt from "@/components/mixer/BundleSpinIt";
import { useAddToBasket } from "@/components/cart/useAddToBasket";
import { Button, ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { formatPrice } from "@/lib/catalogue";
import { bundles, type ResolvedBundle } from "@/lib/bundles";

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="-ml-1 h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path
        d="M3 8.4 6.4 12 13 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BundleCard({ bundle }: { bundle: ResolvedBundle }) {
  const { addCustomBlend } = useAddToBasket();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const t = window.setTimeout(() => setJustAdded(false), 2000);
    return () => window.clearTimeout(t);
  }, [justAdded]);

  return (
    <article className="group card-motion relative flex h-full flex-col rounded-[2px] border border-ink-line bg-ink-card hover:-translate-y-[3px] hover:border-gold-deep/70 hover:shadow-raise">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[2px]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `radial-gradient(118% 88% at 50% 12%, ${bundle.blend.accent}40 0%, ${bundle.blend.accentDeep}26 46%, transparent 72%), linear-gradient(163deg, #191510 0%, #0c0a08 58%, #120f0b 100%)`,
          }}
        />
        <div className="absolute inset-x-0 -top-[3%] -bottom-[3%] flex items-end justify-center [transition:scale_1200ms_var(--ease-out-quint)] group-hover:scale-[1.045]">
          <div className="h-[86%]" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
            <BottleArt
              uid={`bundle-${bundle.id}`}
              accent={bundle.blend.accent}
              accentDeep={bundle.blend.accentDeep}
              width="100%"
              height="100%"
              seed={bundle.id.length + bundle.name.charCodeAt(0)}
              dropletCount={8}
              labelDetail="mark"
              arcs={false}
              className="drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
              title={`${bundle.name}, ${bundle.blend.composition}`}
            />
          </div>
        </div>

        <span className="pointer-events-none absolute left-0 top-4 bg-ink/80 py-1.5 pl-4 pr-3 font-sans text-2xs tracking-label text-gold uppercase backdrop-blur-sm">
          Bundle
        </span>

        <BundleSpinIt bundle={bundle} className="absolute bottom-3 left-3" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-xl leading-tight tracking-[0.02em] text-cream">
            {bundle.name}
          </h3>
          <p className="numeric shrink-0 font-display text-xl leading-tight text-gold">
            {formatPrice(bundle.blend.price)}
          </p>
        </div>

        <p className="mt-2 text-sm leading-relaxed font-light text-cream-dim">
          {bundle.tagline}
        </p>

        <div className="mt-4 mb-4 h-px bg-ink-line" />

        <p className="numeric text-label tracking-[0.1em] text-cream-faint uppercase">
          {bundle.blend.composition}
        </p>

        <div className="mt-5 flex-1" />

        <Button
          variant={justAdded ? "primary" : "secondary"}
          size="md"
          fullWidth
          onClick={(event) => {
            const ok = addCustomBlend(
              event.currentTarget,
              bundle.components,
              bundle.name,
              bundle.blend,
            );
            if (ok) setJustAdded(true);
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
          {justAdded ? `${bundle.name} added to your basket` : ""}
        </span>
      </div>
    </article>
  );
}

export function BuildABlend() {
  return (
    <section
      aria-labelledby="blend-heading"
      className="relative border-t border-ink-line py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="font-sans text-[0.6875rem] tracking-label text-gold uppercase">
                Build a blend
              </p>
              <h2
                id="blend-heading"
                className="text-foil mt-4 font-display text-3xl leading-none font-medium tracking-[0.06em] sm:text-4xl lg:text-5xl"
              >
                MIX YOUR OWN
              </h2>
            </div>
            <p className="max-w-md text-[0.9375rem] leading-relaxed font-light text-cream-dim">
              Three to start you off. Spin any of them in 3D, or pick your
              own parts below.
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {bundles.map((bundle, index) => (
            <Reveal as="li" key={bundle.id} delay={index * 0.08} className="flex">
              <BundleCard bundle={bundle} />
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1}>
          <div className="mt-10 flex items-center justify-center">
            <ButtonLink href="/mixer" variant="secondary" size="lg">
              Build your own blend
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default BuildABlend;
