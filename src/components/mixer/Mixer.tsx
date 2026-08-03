"use client";

import { useId, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatPrice, juices } from "@/lib/catalogue";
import {
  buildBlend,
  sanitiseBlendName,
  MAX_COMPONENTS,
  MAX_NAME_LENGTH,
  MAX_PARTS,
  MIN_PARTS,
  type BlendComponent,
} from "@/lib/blend";
import { useAddToBasket } from "@/components/cart/useAddToBasket";
import { Button } from "@/components/ui/Button";
import BlendPreview from "@/components/mixer/BlendPreview";
import JuiceTile from "@/components/mixer/JuiceTile";

/**
 * Build Your Own Blend.
 *
 * All the arithmetic — colour, price, name, allergens — lives in lib/blend, so
 * what is shown here is exactly what the checkout route recomputes from the
 * ids and parts this component sends. Nothing about the price is state.
 *
 * The page opens with a real blend already in the bottle rather than an empty
 * glass: it takes one look to understand what the controls do.
 */

const OPENING_BLEND: BlendComponent[] = [
  { juiceId: "classic-orange", parts: 2 },
  { juiceId: "apple", parts: 1 },
];

export default function Mixer() {
  const { addCustomBlend } = useAddToBasket();
  const [picked, setPicked] = useState<BlendComponent[]>(OPENING_BLEND);
  /** null until the customer types — the field follows the mix until then. */
  const [customName, setCustomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameFieldId = useId();
  const nameHintId = `${nameFieldId}-hint`;

  const blend = useMemo(() => {
    const result = buildBlend(picked);
    return result.ok ? result.blend : null;
  }, [picked]);

  const name = customName ?? blend?.autoName ?? "";
  const full = picked.length >= MAX_COMPONENTS;

  function toggle(juiceId: string) {
    setError(null);
    setPicked((current) => {
      if (current.some((c) => c.juiceId === juiceId)) {
        return current.filter((c) => c.juiceId !== juiceId);
      }
      if (current.length >= MAX_COMPONENTS) return current;
      // New picks start at one part; the stepper is right there if they want
      // more of it.
      return [...current, { juiceId, parts: 1 }];
    });
  }

  function setParts(juiceId: string, parts: number) {
    const clamped = Math.max(MIN_PARTS, Math.min(parts, MAX_PARTS));
    setPicked((current) =>
      current.map((c) => (c.juiceId === juiceId ? { ...c, parts: clamped } : c)),
    );
  }

  function handleAdd(event: MouseEvent<HTMLButtonElement>) {
    if (!blend) return;
    // The flying bottle carries the blend's own mixed colour, so what leaves
    // the button is visibly the thing in the preview panel.
    const added = addCustomBlend(
      event.currentTarget,
      blend.components.map((c) => ({ juiceId: c.product.id, parts: c.parts })),
      name,
      blend,
    );
    if (!added) {
      setError("We couldn't add that blend. Change something and try again.");
    }
  }

  const addLabel = blend
    ? `Add to basket · ${formatPrice(blend.price)}`
    : "Add to basket";

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-12 xl:gap-16">
        {/* ---------- Preview. First on a phone, second on a desktop, so the
             colour is visible while the controls are under the thumb. ---------- */}
        {/* Not sticky: the panel is taller than a laptop viewport, and a tall
            sticky element pins its top and hides its own total. */}
        <aside className="order-first lg:order-last">
          <BlendPreview blend={blend} name={name}>
            <div className="mt-5 hidden lg:block">
              <Button variant="primary" size="md" fullWidth onClick={handleAdd}>
                {addLabel}
              </Button>
            </div>
          </BlendPreview>
        </aside>

        <div className="min-w-0">
          {/* ---------- Juices ---------- */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-xl text-cream">
              Pick up to {MAX_COMPONENTS} juices
            </h2>
            <p
              aria-live="polite"
              className="numeric text-xs uppercase tracking-label text-cream-faint"
            >
              {picked.length} of {MAX_COMPONENTS} chosen
            </p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-cream-dim">
            Then set how many parts of each. {MIN_PARTS} to {MAX_PARTS} parts,
            whole numbers only. It has to be pourable at the press.
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {juices.map((juice) => (
              <JuiceTile
                key={juice.id}
                juice={juice}
                parts={picked.find((c) => c.juiceId === juice.id)?.parts ?? null}
                full={full}
                onToggle={() => toggle(juice.id)}
                onParts={(parts) => setParts(juice.id, parts)}
              />
            ))}
          </ul>

          {full ? (
            <p className="mt-3 text-xs leading-relaxed text-cream-faint">
              That&rsquo;s {MAX_COMPONENTS}. Take one out to swap it for
              something else. Past three juices nothing tastes of anything.
            </p>
          ) : null}

          {/* ---------- Name ---------- */}
          <div className="mt-10 border-t border-ink-line pt-8">
            <label
              htmlFor={nameFieldId}
              className="block font-display text-xl text-cream"
            >
              Name it
            </label>
            <p className="mt-2 text-sm leading-relaxed text-cream-dim">
              We&rsquo;ve named it after what&rsquo;s in it. Call it something
              else if you like. The name goes on the pack sheet.
            </p>

            <input
              id={nameFieldId}
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              placeholder={blend?.autoName ?? "Your blend"}
              aria-describedby={nameHintId}
              onChange={(e) => setCustomName(e.target.value)}
              onBlur={(e) =>
                setCustomName(
                  e.target.value.trim().length === 0
                    ? null
                    : sanitiseBlendName(e.target.value, blend?.autoName ?? ""),
                )
              }
              className="mt-4 w-full border border-ink-line bg-ink-raised px-4 py-3 text-cream transition-colors placeholder:text-cream-faint focus:border-gold focus:outline-none"
            />

            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p id={nameHintId} className="text-xs text-cream-faint">
                <span className="numeric">
                  {name.length}/{MAX_NAME_LENGTH}
                </span>{" "}
                characters
              </p>
              {customName !== null && blend ? (
                <button
                  type="button"
                  onClick={() => setCustomName(null)}
                  className="text-xs uppercase tracking-label text-cream-faint transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Use {blend.autoName}
                </button>
              ) : null}
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-6 border-l-2 border-warn bg-warn/[0.06] py-2 pl-3 text-sm leading-relaxed text-warn"
            >
              {error}
            </p>
          ) : null}

          <p className="mt-8 text-xs leading-relaxed text-cream-faint">
            Blends are 330ml, cold pressed to order on the morning of your drop.
            Allergen information for every juice is on the{" "}
            <Link
              href="/allergens"
              className="text-gold underline underline-offset-2"
            >
              allergens page
            </Link>
            {". "}Check it before you order if you need to be certain.
          </p>

          {/* Keeps the sticky bar from covering the last of the page. */}
          <div aria-hidden className="h-24 lg:hidden" />
        </div>
      </div>

      {/* ---------- Phone action bar ----------
           Fixed rather than in-flow so the price and the one button that
           matters stay in reach while the juice list is being worked through.
           Hidden outright on desktop, where the panel above carries them. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-ink/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
          <span
            aria-hidden
            className="h-10 w-10 shrink-0 rounded-[2px] border border-ink-line transition-colors duration-500"
            style={{
              background: blend
                ? `linear-gradient(160deg, ${blend.accent}, ${blend.accentDeep})`
                : "transparent",
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-cream-dim">
              {blend ? name : "Nothing picked yet"}
            </p>
            <p className="numeric font-display text-lg leading-tight text-foil">
              {blend ? formatPrice(blend.price) : "—"}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleAdd}
            disabled={!blend}
          >
            Add
          </Button>
        </div>
      </div>
    </>
  );
}
