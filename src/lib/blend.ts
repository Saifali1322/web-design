/**
 * Custom blends — everything "Build Your Own Blend" is made of.
 *
 * Pure functions, no React and no browser APIs: the mixer UI, the cart and the
 * checkout route all import this file. That is the point. The server has to be
 * able to rebuild a blend — its price, its name, its allergens — from nothing
 * but a list of juice ids and parts, because that is all the client is ever
 * allowed to send.
 *
 * The model is deliberately coarse. Blends are expressed in whole PARTS, not
 * percentages, because somebody has to stand at a press and pour this: "2 parts
 * orange, 1 part carrot" is an instruction, "17.3% orange" is not.
 */

import {
  allergenOrder,
  juices,
  type Allergen,
  type Product,
} from "@/lib/catalogue";

/* ------------------------------------------------------------------ *
 * Rules
 * ------------------------------------------------------------------ */

/** More than three juices in one bottle stops tasting of anything. */
export const MAX_COMPONENTS = 3;
export const MIN_PARTS = 1;
export const MAX_PARTS = 4;

/** Fits a printed pack sheet and a Stripe line item without wrapping. */
export const MAX_NAME_LENGTH = 40;

/** Blend prices round up to a whole 10p, so a blend never undercuts its parts. */
export const PRICE_STEP = 10;

/**
 * Flat surcharge for a made-to-order bottle, in pence, added after rounding.
 * A bespoke blend is pressed on its own rather than as part of a batch, and
 * that time is real. Shown to the customer as its own line — see the mixer's
 * price breakdown.
 */
export const BLEND_PREMIUM = 100;

export interface BlendComponent {
  juiceId: string;
  /** Whole parts, {@link MIN_PARTS}–{@link MAX_PARTS}. */
  parts: number;
}

export interface ResolvedComponent {
  product: Product;
  parts: number;
}

export interface BlendPricing {
  totalParts: number;
  /** Σ(unit price × parts), in pence. */
  weightedTotal: number;
  /** Weighted average before rounding, in pence. Display only — never charged. */
  average: number;
  /** Weighted average rounded up to {@link PRICE_STEP}, in pence. */
  ingredients: number;
  /** {@link BLEND_PREMIUM}. Broken out so the UI can show it honestly. */
  premium: number;
  /** What the customer actually pays per bottle, in pence. */
  price: number;
}

export interface Blend {
  /** Canonical encoding. Doubles as the cart's merge key. */
  code: string;
  /** Dominant part first, then catalogue order. */
  components: ResolvedComponent[];
  pricing: BlendPricing;
  /** Per-bottle price in pence. Shorthand for `pricing.price`. */
  price: number;
  /** Generated from the mix, e.g. "Orange & Carrot Blend". */
  autoName: string;
  /** Pouring instruction, e.g. "2 parts Orange + 1 part Carrot". */
  composition: string;
  allergens: Allergen[];
  ingredients: string[];
  accent: string;
  accentDeep: string;
}

export type BlendErrorCode =
  | "empty"
  | "too_many"
  | "unknown_juice"
  | "duplicate"
  | "bad_parts";

export interface BlendError {
  code: BlendErrorCode;
  message: string;
  juiceId?: string;
}

export type BlendResult =
  | { ok: true; blend: Blend }
  | { ok: false; error: BlendError };

/* ------------------------------------------------------------------ *
 * OKLab
 *
 * Mixing two juices in sRGB gives mud: orange and red average to a dead brown
 * because sRGB's channel values are gamma-encoded and its axes are not
 * perceptual. OKLab is, so a weighted mean in OKLab lands on the colour a
 * person would actually get in the bottle — still vivid, still the right hue.
 *
 * Conversion follows Björn Ottosson's published matrices.
 * ------------------------------------------------------------------ */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Oklab {
  L: number;
  a: number;
  b: number;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export function hexToRgb(hex: string): Rgb {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const byte = (v: number) =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/** sRGB transfer function, gamma-encoded → linear light. */
const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const fromLinear = (c: number): number =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

export function rgbToOklab({ r, g, b }: Rgb): Oklab {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToRgb({ L, a, b }: Oklab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  // Clamped rather than gamut-mapped: the catalogue accents are all well
  // inside sRGB, so any excursion here is float noise at the third decimal.
  return {
    r: clamp01(fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp01(fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp01(fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  };
}

/** Weighted perceptual mean of hex colours. Weights need not sum to anything. */
export function mixOklab(colours: string[], weights: number[]): string {
  if (colours.length === 0) return "#000000";
  if (colours.length === 1) return colours[0];

  let total = 0;
  let L = 0;
  let a = 0;
  let b = 0;

  colours.forEach((hex, i) => {
    const w = weights[i] ?? 0;
    if (w <= 0) return;
    const lab = rgbToOklab(hexToRgb(hex));
    L += lab.L * w;
    a += lab.a * w;
    b += lab.b * w;
    total += w;
  });

  if (total === 0) return colours[0];
  return rgbToHex(oklabToRgb({ L: L / total, a: a / total, b: b / total }));
}

/* ------------------------------------------------------------------ *
 * Canonical encoding
 *
 * Sorting by juice id means the same recipe always produces the same string
 * however the customer built it, which is what lets the cart merge two
 * identical blends into one line of quantity 2 instead of stacking duplicates.
 * ------------------------------------------------------------------ */

export function encodeBlend(components: ReadonlyArray<BlendComponent>): string {
  return [...components]
    .sort((x, y) => (x.juiceId < y.juiceId ? -1 : x.juiceId > y.juiceId ? 1 : 0))
    .map((c) => `${c.juiceId}:${c.parts}`)
    .join("+");
}

/** Inverse of {@link encodeBlend}. Shape only — {@link buildBlend} validates. */
export function decodeBlend(code: string): BlendComponent[] | null {
  if (typeof code !== "string" || code.length === 0 || code.length > 200) {
    return null;
  }

  const out: BlendComponent[] = [];
  for (const chunk of code.split("+")) {
    const [juiceId, rawParts, ...rest] = chunk.split(":");
    if (!juiceId || !rawParts || rest.length > 0) return null;
    const parts = Number(rawParts);
    if (!Number.isInteger(parts)) return null;
    out.push({ juiceId, parts });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Pricing
 * ------------------------------------------------------------------ */

/**
 * The single pricing rule, used by the mixer and by the checkout route.
 *
 * Weighted average by parts, rounded UP to the nearest 10p, then the flat
 * bespoke premium. Rounding up is what stops a blend costing less than the
 * juices it is made of once the fractions land badly.
 *
 * Done in integers throughout — money and float division do not mix.
 */
export function priceBlend(
  components: ReadonlyArray<ResolvedComponent>,
): BlendPricing {
  const totalParts = components.reduce((sum, c) => sum + c.parts, 0);
  const weightedTotal = components.reduce(
    (sum, c) => sum + c.product.price * c.parts,
    0,
  );

  if (totalParts === 0) {
    return {
      totalParts: 0,
      weightedTotal: 0,
      average: 0,
      ingredients: 0,
      premium: BLEND_PREMIUM,
      price: BLEND_PREMIUM,
    };
  }

  // ceil(weightedTotal / totalParts / STEP) * STEP, without ever touching a
  // float: integer ceiling division is ⌊(a + b − 1) / b⌋.
  const divisor = totalParts * PRICE_STEP;
  const ingredients =
    Math.floor((weightedTotal + divisor - 1) / divisor) * PRICE_STEP;

  return {
    totalParts,
    weightedTotal,
    average: weightedTotal / totalParts,
    ingredients,
    premium: BLEND_PREMIUM,
    price: ingredients + BLEND_PREMIUM,
  };
}

/* ------------------------------------------------------------------ *
 * Naming
 * ------------------------------------------------------------------ */

/** The name a juice goes by inside a blend, e.g. "Classic Orange" → "Orange". */
export const componentName = (product: Product): string =>
  product.shortName ?? product.name;

/**
 * Dominant part first so the name leads with what the drink mostly is; ties
 * fall back to catalogue order, which keeps the output deterministic (the
 * server generates the same name the customer saw).
 */
function byDominance(a: ResolvedComponent, b: ResolvedComponent): number {
  if (b.parts !== a.parts) return b.parts - a.parts;
  return (
    juices.findIndex((j) => j.id === a.product.id) -
    juices.findIndex((j) => j.id === b.product.id)
  );
}

export function autoBlendName(
  components: ReadonlyArray<ResolvedComponent>,
): string {
  const names = [...components].sort(byDominance).map((c) => componentName(c.product));
  if (names.length === 0) return "Custom Blend";
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;

  // The generated name has to survive sanitiseBlendName untouched, or the
  // customer sees one name in the field and a truncated one on the pack sheet.
  // Three long juices ("Orange Carrot, Pomegranate & Watermelon") overshoot by
  // a few characters, so the suffix is what gives.
  const suffixed = `${list} Blend`;
  return suffixed.length <= MAX_NAME_LENGTH ? suffixed : list;
}

/**
 * The pouring instruction. Joined with "+" rather than commas on purpose: this
 * string travels into Stripe metadata and the owner's order ticket, which
 * splits its item list on ", ".
 */
export function describeComposition(
  components: ReadonlyArray<ResolvedComponent>,
): string {
  return [...components]
    .sort(byDominance)
    .map((c) => `${c.parts} part${c.parts === 1 ? "" : "s"} ${componentName(c.product)}`)
    .join(" + ");
}

/**
 * Customer-typed names end up in Stripe metadata and on a printed pack sheet,
 * so they get an allowlist rather than an escape pass: letters, digits, spaces
 * and the handful of punctuation marks a drink name actually needs. Anything
 * else is dropped rather than rejected — nobody should be told off by a form
 * for pasting an emoji.
 */
export function sanitiseBlendName(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const cleaned = raw
    .replace(/[^\p{L}\p{N} &+'’\-,.!]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

/* ------------------------------------------------------------------ *
 * Building
 * ------------------------------------------------------------------ */

const findJuice = (id: string): Product | undefined =>
  juices.find((j) => j.id === id);

/**
 * Validates an untrusted component list and derives everything downstream of
 * it. This is the only way a {@link Blend} is ever created, on the client or
 * the server, so the price the mixer shows and the price Stripe charges come
 * from the same arithmetic.
 */
export function buildBlend(
  components: ReadonlyArray<BlendComponent>,
): BlendResult {
  if (!Array.isArray(components) || components.length === 0) {
    return {
      ok: false,
      error: { code: "empty", message: "Pick at least one juice to blend." },
    };
  }

  if (components.length > MAX_COMPONENTS) {
    return {
      ok: false,
      error: {
        code: "too_many",
        message: `A blend can hold up to ${MAX_COMPONENTS} juices.`,
      },
    };
  }

  const resolved: ResolvedComponent[] = [];
  const seen = new Set<string>();

  for (const component of components) {
    const product = findJuice(component.juiceId);
    if (!product) {
      return {
        ok: false,
        error: {
          code: "unknown_juice",
          juiceId: String(component.juiceId),
          message: `"${component.juiceId}" isn't one of our juices.`,
        },
      };
    }
    if (seen.has(product.id)) {
      return {
        ok: false,
        error: {
          code: "duplicate",
          juiceId: product.id,
          message: `${product.name} is in this blend twice.`,
        },
      };
    }
    if (
      !Number.isInteger(component.parts) ||
      component.parts < MIN_PARTS ||
      component.parts > MAX_PARTS
    ) {
      return {
        ok: false,
        error: {
          code: "bad_parts",
          juiceId: product.id,
          message: `Each juice takes ${MIN_PARTS}–${MAX_PARTS} parts.`,
        },
      };
    }
    seen.add(product.id);
    resolved.push({ product, parts: component.parts });
  }

  const ordered = [...resolved].sort(byDominance);
  const weights = ordered.map((c) => c.parts);
  const pricing = priceBlend(ordered);

  return {
    ok: true,
    blend: {
      code: encodeBlend(
        ordered.map((c) => ({ juiceId: c.product.id, parts: c.parts })),
      ),
      components: ordered,
      pricing,
      price: pricing.price,
      autoName: autoBlendName(ordered),
      composition: describeComposition(ordered),
      // Derived, never hardcoded: the day a juice gains an allergen, every
      // blend containing it declares that allergen without another edit.
      allergens: allergenOrder.filter((a) =>
        ordered.some((c) => c.product.allergens.includes(a)),
      ),
      ingredients: [
        ...new Set(ordered.flatMap((c) => c.product.ingredients)),
      ],
      accent: mixOklab(
        ordered.map((c) => c.product.accent),
        weights,
      ),
      accentDeep: mixOklab(
        ordered.map((c) => c.product.accentDeep),
        weights,
      ),
    },
  };
}

/** Convenience for the stored/encoded form. */
export function buildBlendFromCode(code: string): BlendResult {
  const components = decodeBlend(code);
  if (!components) {
    return {
      ok: false,
      error: { code: "empty", message: "That blend didn't make sense." },
    };
  }
  return buildBlend(components);
}
