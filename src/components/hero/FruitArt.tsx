"use client";

/**
 * Background garnish for the hero: stylised fruit silhouettes and ice cubes.
 *
 * These sit far behind the bottles at low opacity, drifting and turning. At
 * that size and contrast a detailed illustration turns to noise, so each fruit
 * is a single confident silhouette plus one highlight — the shape does the
 * work. Keyed by `Product.fruit` from the catalogue.
 */

export type FruitKind =
  | "orange"
  | "apple"
  | "pineapple"
  | "carrot"
  | "watermelon"
  | "pomegranate"
  | "mango";

const KINDS = new Set<string>([
  "orange",
  "apple",
  "pineapple",
  "carrot",
  "watermelon",
  "pomegranate",
  "mango",
]);

export const isFruitKind = (v: string | undefined): v is FruitKind =>
  typeof v === "string" && KINDS.has(v);

/** Darken a #rrggbb by `amount` (0..1). Used for the silhouette gradient. */
function shade(hex: string, amount: number): string {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* Silhouettes, all drawn in a 100×100 box.
 *
 * `body` is the mass, `leaf` sits behind it in the darker tone, and `line` is
 * a single optional contour drawn over the top. Anything more than that turns
 * to scribble once the shape is blurred back into the set.
 */

interface Shape {
  body: string;
  leaf?: string;
  line?: string;
  /** Small filled marks — seeds, pips. */
  dots?: [number, number, number][];
}

const SHAPES: Record<FruitKind, Shape> = {
  orange: {
    body: "M50 13a37 37 0 1 1 0 74 37 37 0 0 1 0-74Z",
    leaf: "M53 15c9-11 22-13 30-11-2 10-11 19-22 20-4 0-7-4-8-9Z",
    line: "M50 13a37 37 0 0 1 0 74",
  },
  apple: {
    body:
      "M50 26c8-8 22-9 30 1 8 10 7 27 0 42-5 11-13 18-20 18-4 0-6-2-10-2s-6 2-10 2c-7 0-15-7-20-18-7-15-8-32 0-42 8-10 22-9 30-1Z",
    leaf: "M53 14c8-8 18-9 25-7-2 8-10 15-19 15-3 0-5-3-6-8Z",
    line: "M50 26c0-9 2-15 7-21",
  },
  pineapple: {
    body: "M50 36c17 0 28 13 28 29s-11 29-28 29-28-13-28-29 11-29 28-29Z",
    leaf:
      "M50 36c-3-13-10-22-20-27 12-1 20 5 23 13 2-11 8-19 19-23-3 12-6 22-11 29 9-6 18-7 27-4-9 7-20 11-27 13Z",
    line: "M28 52 72 78M72 52 28 78",
  },
  carrot: {
    body: "M50 32c10 0 17 5 17 11 0 10-9 51-17 51s-17-41-17-51c0-6 7-11 17-11Z",
    leaf:
      "M50 32c-5-11-14-17-25-19 10-6 21-1 27 9 1-11 6-19 15-23 1 12-2 22-8 28 9-4 18-3 26 2-11 4-22 5-29 7Z",
    line: "M41 52h18M43 68h14",
  },
  watermelon: {
    body: "M8 32h84c0 32-19 55-42 55S8 64 8 32Z",
    line: "M19 38c0 24 14 41 31 41s31-17 31-41",
    dots: [
      [38, 48, 2.6],
      [62, 48, 2.6],
      [50, 62, 2.6],
      [30, 58, 2.2],
      [70, 58, 2.2],
    ],
  },
  pomegranate: {
    body: "M50 24c20 0 35 15 35 34S70 90 50 90 15 73 15 58s15-34 35-34Z",
    leaf: "M43 24 46 8l4 8 4-8 3 16Z",
    line: "M50 24c-11 8-16 20-16 34",
  },
  mango: {
    body:
      "M68 18c15 5 22 22 17 41-5 19-21 32-38 32-12 0-20-8-20-21 0-23 21-58 41-52Z",
    leaf: "M68 18c4-6 10-9 16-9-2 7-7 12-13 13Z",
    line: "M62 32c-11 7-21 22-25 37",
  },
};

export interface FruitArtProps {
  kind: FruitKind;
  /** Number for CSS pixels, or a string such as "100%" to fill a box. */
  size?: number | string;
  /** Juice accent the garnish is tinted with. */
  tint: string;
  uid: string;
  className?: string;
  opacity?: number;
}

export function FruitArt({
  kind,
  size = "100%",
  tint,
  uid,
  className = "",
  opacity = 1,
}: FruitArtProps) {
  const shape = SHAPES[kind] ?? SHAPES.orange;
  /* Against a near-black ground a straight tint→dark ramp turns to mud, so
     the fill runs from a lifted tint down to a still-saturated deep. */
  const lift = tintUp(tint, 0.22);
  const deep = shade(tint, 0.55);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ display: "block", opacity }}
    >
      <defs>
        <linearGradient id={`${uid}-f`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={lift} />
          <stop offset="0.55" stopColor={tint} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <radialGradient id={`${uid}-h`} cx="0.34" cy="0.3" r="0.42">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {shape.leaf ? <path d={shape.leaf} fill={deep} opacity="0.9" /> : null}
      <path d={shape.body} fill={`url(#${uid}-f)`} />
      {shape.line ? (
        <path
          d={shape.line}
          fill="none"
          stroke={deep}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.55"
        />
      ) : null}
      {shape.dots?.map(([cx, cy, r], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={r * 0.7}
          ry={r}
          fill="#1a0d0a"
          opacity="0.65"
          transform={`rotate(${(i - 2) * 14} ${cx} ${cy})`}
        />
      ))}
      {/* one highlight, so it reads as a solid object and not a sticker */}
      <ellipse cx="50" cy="50" rx="46" ry="46" fill={`url(#${uid}-h)`} />
      <path
        d={shape.body}
        fill="none"
        stroke="#f3da8b"
        strokeOpacity="0.32"
        strokeWidth="1.1"
      />
    </svg>
  );
}

/** Lighten a #rrggbb toward white by `amount` (0..1). */
function tintUp(hex: string, amount: number): string {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const up = (c: number) => Math.round(c + (255 - c) * amount);
  const r = up((n >> 16) & 255);
  const g = up((n >> 8) & 255);
  const b = up(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** A chunk of ice. Flat facets, one bright edge — no attempt at refraction. */
export function IceCube({
  size = "100%",
  uid,
  className = "",
}: {
  size?: number | string;
  uid: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`${uid}-top`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#e6f4ff" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={`${uid}-left`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcdcee" stopOpacity="0.1" />
          <stop offset="1" stopColor="#8fb9d0" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={`${uid}-right`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#cfe6f2" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {/* three faces of a cube, drawn isometrically */}
      <path d="M50 8 88 30 50 52 12 30Z" fill={`url(#${uid}-top)`} />
      <path d="M12 30 50 52v40L12 70Z" fill={`url(#${uid}-left)`} />
      <path d="M88 30 50 52v40l38-22Z" fill={`url(#${uid}-right)`} />
      <path
        d="M50 8 88 30v40L50 92 12 70V30Z"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 30 50 52l38-22M50 52v40"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.4"
        strokeWidth="1.1"
      />
      {/* the lit edge — the only genuinely bright line on the cube */}
      <path
        d="M50 8 88 30"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.8"
      />
      <path
        d="M22 36 44 49"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export default FruitArt;
