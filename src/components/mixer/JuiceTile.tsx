"use client";

import { formatPrice, type Product } from "@/lib/catalogue";
import { MAX_PARTS, MIN_PARTS } from "@/lib/blend";

/**
 * One juice in the mixer.
 *
 * The select control and the parts stepper are separate buttons rather than a
 * stepper nested inside a toggle — nested buttons are invalid HTML and break
 * keyboard use. Every hit area is at least 44px tall, because this is a phone
 * screen held in one hand.
 */

export interface JuiceTileProps {
  juice: Product;
  parts: number | null;
  /** No slots left in the blend, so an unselected juice can't be added. */
  full: boolean;
  onToggle: () => void;
  onParts: (parts: number) => void;
}

export default function JuiceTile({
  juice,
  parts,
  full,
  onToggle,
  onParts,
}: JuiceTileProps) {
  const selected = parts !== null;
  const locked = !selected && full;

  return (
    <li
      className={`rounded-[2px] border transition-colors duration-300 ${
        selected
          ? "border-gold-deep bg-ink-card"
          : "border-ink-line bg-ink-raised"
      } ${locked ? "opacity-45" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={locked}
        aria-pressed={selected}
        className="flex w-full items-center gap-3 px-3 py-3 text-left disabled:cursor-not-allowed"
      >
        <span
          aria-hidden
          className="h-10 w-10 shrink-0 rounded-[2px] border border-ink-line"
          style={{
            background: `linear-gradient(160deg, ${juice.accent}, ${juice.accentDeep})`,
          }}
        />

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base leading-snug text-cream">
            {juice.name}
          </span>
          <span className="numeric block text-xs text-cream-faint">
            {formatPrice(juice.price)} · {juice.size}
          </span>
        </span>

        <span
          aria-hidden
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] border text-xs ${
            selected
              ? "border-gold bg-gold text-ink"
              : "border-ink-line text-transparent"
          }`}
        >
          ✓
        </span>
      </button>

      {selected ? (
        <div className="flex items-center justify-between gap-3 border-t border-ink-line px-3 py-2">
          <span className="text-xs uppercase tracking-label text-cream-faint">
            {parts} part{parts === 1 ? "" : "s"}
          </span>

          <div className="inline-flex items-center border border-ink-line">
            <PartsButton
              label={`One part less ${juice.name}`}
              onClick={() => onParts(parts - 1)}
              disabled={parts <= MIN_PARTS}
            >
              <path d="M5 12h14" strokeLinecap="round" />
            </PartsButton>

            <span
              aria-live="polite"
              aria-label={`Parts of ${juice.name}`}
              className="numeric w-10 text-center text-sm text-cream"
            >
              {parts}
            </span>

            <PartsButton
              label={`One part more ${juice.name}`}
              onClick={() => onParts(parts + 1)}
              disabled={parts >= MAX_PARTS}
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </PartsButton>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function PartsButton({
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
      className="flex h-11 w-11 items-center justify-center text-cream-dim transition-colors hover:bg-ink-card hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold disabled:cursor-not-allowed disabled:text-cream-faint/30"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
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
