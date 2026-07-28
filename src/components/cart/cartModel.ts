/**
 * The basket's data model, kept out of the provider so it stays pure.
 *
 * A basket line is one of two things: a catalogue product, or a custom blend
 * built in the mixer. Neither carries a price — prices are looked up from the
 * catalogue on every render and recomputed again server-side at checkout, so
 * nothing in localStorage can ever influence what somebody is charged.
 */

import { getProduct, type Product } from "@/lib/catalogue";
import {
  buildBlend,
  buildBlendFromCode,
  sanitiseBlendName,
  type Blend,
  type BlendComponent,
} from "@/lib/blend";

export interface ProductLine {
  kind: "product";
  productId: string;
  quantity: number;
}

export interface BlendLine {
  kind: "blend";
  /** Canonical blend encoding — see `encodeBlend`. */
  code: string;
  /** What the customer called it. Already sanitised. */
  name: string;
  quantity: number;
}

export type CartLine = ProductLine | BlendLine;

export const MAX_LINE_QUANTITY = 99;

/**
 * Identity of a line, for React keys, quantity updates and merging.
 *
 * Blends key on their canonical encoding, which is what makes the same recipe
 * added twice come back as one line of quantity 2 rather than two lines.
 */
export function lineKey(line: CartLine): string {
  return line.kind === "blend" ? `b:${line.code}` : `p:${line.productId}`;
}

/* ---------- resolved items (what the UI renders) ---------- */

interface BaseItem {
  key: string;
  quantity: number;
  /** Per-unit price in pence, from the catalogue. */
  unitPrice: number;
  lineTotal: number;
  name: string;
}

export interface ProductCartItem extends BaseItem {
  kind: "product";
  product: Product;
}

export interface BlendCartItem extends BaseItem {
  kind: "blend";
  blend: Blend;
}

export type CartItem = ProductCartItem | BlendCartItem;

/**
 * Turns a stored line into something renderable, or null if it no longer makes
 * sense — a discontinued product, or a blend whose juice has left the menu.
 * Dropping the line is the right call: the alternative is a basket that fails
 * at checkout with no explanation.
 */
export function resolveLine(line: CartLine): CartItem | null {
  if (line.kind === "product") {
    const product = getProduct(line.productId);
    if (!product) return null;
    return {
      kind: "product",
      key: lineKey(line),
      product,
      name: product.name,
      quantity: line.quantity,
      unitPrice: product.price,
      lineTotal: product.price * line.quantity,
    };
  }

  const result = buildBlendFromCode(line.code);
  if (!result.ok) return null;
  const blend = result.blend;
  return {
    kind: "blend",
    key: lineKey(line),
    blend,
    name: line.name || blend.autoName,
    quantity: line.quantity,
    unitPrice: blend.price,
    lineTotal: blend.price * line.quantity,
  };
}

/** The blend line for a freshly mixed blend, ready to go into the reducer. */
export function blendLine(
  components: ReadonlyArray<BlendComponent>,
  name: string,
  quantity = 1,
): BlendLine | null {
  const result = buildBlend(components);
  if (!result.ok) return null;
  return {
    kind: "blend",
    code: result.blend.code,
    name: sanitiseBlendName(name, result.blend.autoName),
    quantity: clampQuantity(quantity),
  };
}

export const clampQuantity = (n: number): number =>
  Math.max(1, Math.min(Math.trunc(n), MAX_LINE_QUANTITY));

/* ------------------------------------------------------------------ *
 * Storage
 *
 * v1 stored a bare array of {productId, quantity}. v2 wraps the lines in an
 * envelope and adds the blend kind. Both shapes are read below, so a basket
 * left in a tab yesterday survives the upgrade instead of quietly emptying.
 * ------------------------------------------------------------------ */

export const STORAGE_KEY = "jc.cart.v2";
export const LEGACY_STORAGE_KEY = "jc.cart.v1";

export interface StoredCart {
  v: 2;
  lines: CartLine[];
}

export const serialiseCart = (lines: CartLine[]): string =>
  JSON.stringify({ v: 2, lines } satisfies StoredCart);

/**
 * Reads either storage generation into v2 lines, dropping anything that no
 * longer resolves and merging duplicates. Hand-edited or half-migrated
 * payloads land here too, which is why every field is checked rather than
 * cast.
 */
export function parseStoredCart(raw: string | null | undefined): CartLine[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // A corrupt basket is not worth surfacing — start empty.
    return [];
  }
  return normaliseLines(
    Array.isArray(parsed)
      ? parsed // v1: the array was the whole payload
      : (parsed as { lines?: unknown })?.lines,
  );
}

export function normaliseLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];

  const merged = new Map<string, CartLine>();

  for (const entry of input) {
    const line = toLine(entry);
    if (!line) continue;
    const key = lineKey(line);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + line.quantity);
    } else {
      merged.set(key, line);
    }
  }

  return [...merged.values()];
}

function toLine(entry: unknown): CartLine | null {
  if (typeof entry !== "object" || entry === null) return null;
  const raw = entry as Record<string, unknown>;

  // Checked before clamping: clampQuantity has a floor of 1, so a stored 0 or
  // -3 would otherwise come back as a line the customer never asked for.
  const stored =
    typeof raw.quantity === "number" && Number.isFinite(raw.quantity)
      ? Math.trunc(raw.quantity)
      : 0;
  if (stored <= 0) return null;
  const quantity = clampQuantity(stored);

  if (raw.kind === "blend") {
    if (typeof raw.code !== "string") return null;
    const result = buildBlendFromCode(raw.code);
    if (!result.ok) return null;
    return {
      kind: "blend",
      // Re-canonicalised on the way in, so a stored code written by an older
      // build (or by hand) can't split one recipe across two lines.
      code: result.blend.code,
      name: sanitiseBlendName(raw.name, result.blend.autoName),
      quantity,
    };
  }

  // v1 lines have no `kind` at all; anything with a live productId is one.
  if (typeof raw.productId !== "string" || !getProduct(raw.productId)) {
    return null;
  }
  return { kind: "product", productId: raw.productId, quantity };
}
