"use client";

/**
 * Scene dressing for the hero: cut and whole fruit, ice, and a splash.
 *
 * This used to be a set of flat silhouettes, which at any size above a
 * thumbnail read as clip art. The product photographs in
 * `docs/reference/bottles/` are full of *cut* fruit — orange halves with their
 * segments and pith showing, watermelon with rind and seeds — and that is what
 * makes a picture look like a juice picture. So the default face here is a cut
 * one, built the way the real thing is built: rind, then pith, then flesh,
 * then texture.
 *
 * Three rules keep this affordable:
 *
 *  - NO <filter>. Every soft edge is a gradient. The hero blurs these pieces
 *    from CSS on a wrapper, which rasterises once; an SVG filter inside would
 *    re-run on every frame that wrapper moves.
 *  - `detail="simple"` drops the fine texture. Anything small or heavily
 *    defocused takes it — those nodes would be paid for and never seen.
 *  - Geometry that does not depend on props is generated once at module load.
 *
 * The accent of the selected juice arrives as the inherited CSS `color`, not
 * as a prop: every piece paints a wash and a rim light in `currentColor`, so a
 * flavour change can be a plain CSS colour transition on an ancestor instead
 * of a hard re-render of seven SVGs.
 */

import type { ReactElement } from "react";
import { hashRandom } from "./useHeroMotion";

export type FruitKind =
  | "orange"
  | "apple"
  | "pineapple"
  | "carrot"
  | "watermelon"
  | "pomegranate"
  | "mango";

/** `cut` shows the sliced face. `whole` is the uncut fruit, for the far field. */
export type FruitFace = "cut" | "whole";

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

/* ------------------------------------------------------------------ *
 * Colour
 * ------------------------------------------------------------------ */

function parse(hex: string): [number, number, number] | null {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (r: number, g: number, b: number) =>
  `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;

/** Darken toward black by `amount` (0..1). */
export function shade(hex: string, amount: number): string {
  const c = parse(hex);
  if (!c) return hex;
  const d = (v: number) => Math.round(v * (1 - amount));
  return toHex(d(c[0]), d(c[1]), d(c[2]));
}

/** Lighten toward white by `amount` (0..1). */
export function tintUp(hex: string, amount: number): string {
  const c = parse(hex);
  if (!c) return hex;
  const u = (v: number) => Math.round(v + (255 - v) * amount);
  return toHex(u(c[0]), u(c[1]), u(c[2]));
}

/* ------------------------------------------------------------------ *
 * Geometry helpers. Everything is drawn in a 100×100 box.
 * ------------------------------------------------------------------ */

const C = 50;
/** Outer radius of a cut face. Leaves room for the rim stroke. */
const R = 46;

const f2 = (n: number) => Math.round(n * 100) / 100;

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

/**
 * One segment of a citrus wheel — a pie slice with a rounded outer edge and a
 * blunt inner end, so the pale core shows through the middle the way it does
 * on a real half.
 */
function segmentPath(
  i: number,
  n: number,
  r: number,
  gapDeg: number,
  inner: number,
): string {
  const step = 360 / n;
  const a0 = i * step - 90 + gapDeg;
  const a1 = (i + 1) * step - 90 - gapDeg;
  const [x0, y0] = polar(inner, a0 + gapDeg);
  const [x1, y1] = polar(r, a0);
  const [x2, y2] = polar(r, a1);
  const [x3, y3] = polar(inner, a1 - gapDeg);
  return (
    `M${f2(x0)} ${f2(y0)}L${f2(x1)} ${f2(y1)}` +
    `A${r} ${r} 0 0 1 ${f2(x2)} ${f2(y2)}L${f2(x3)} ${f2(y3)}Z`
  );
}

/** Juice vesicles: two fine strokes down the length of each segment. */
function vesicleLines(
  n: number,
  r: number,
  inner: number,
): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  const step = 360 / n;
  for (let i = 0; i < n; i++) {
    for (let k = -1; k <= 1; k += 2) {
      const a = i * step - 90 + step / 2 + k * step * 0.22;
      const [x0, y0] = polar(inner + 3, a);
      const [x1, y1] = polar(r * 0.9, a);
      out.push([f2(x0), f2(y0), f2(x1), f2(y1)]);
    }
  }
  return out;
}

/**
 * Proportions off `04-orange-pour-kitchen.jpeg`: peel and pith together are
 * about a sixth of the radius, and the flesh that is left is *saturated*. An
 * earlier pass had a hairline of peel and a pale wheel of segments, which read
 * as a pinwheel rather than as fruit.
 */
const RIND_R = 46;
const PITH_R = 41.5;
const FLESH_R = 38;

const WHEEL_10 = Array.from({ length: 10 }, (_, i) =>
  segmentPath(i, 10, FLESH_R - 0.6, 2.1, 4.6),
);
const VESICLE_10 = vesicleLines(10, FLESH_R - 0.6, 4.6);

/** The scalloped edge of a pineapple ring. */
const PINEAPPLE_EDGE = (() => {
  const n = 30;
  let d = "";
  for (let i = 0; i < n; i++) {
    const [x, y] = polar(i % 2 === 0 ? R : R - 4.2, (i / n) * 360 - 90);
    d += `${i === 0 ? "M" : "L"}${f2(x)} ${f2(y)}`;
  }
  return `${d}Z`;
})();

/** Pineapple flesh is fibrous — radial strands from the core outward. */
const PINEAPPLE_FIBRES = Array.from({ length: 34 }, (_, i) => {
  const a = (i / 34) * 360 - 90;
  const [x0, y0] = polar(11, a);
  const [x1, y1] = polar(39, a);
  return [f2(x0), f2(y0), f2(x1), f2(y1)] as [number, number, number, number];
});

/**
 * Pomegranate arils, clustered into six lobes with pale membrane between —
 * scattering them evenly reads as a raspberry, not a pomegranate.
 */
const ARILS = (() => {
  const out: [number, number, number, number][] = [];
  let s = 4;
  for (let lobe = 0; lobe < 6; lobe++) {
    const base = lobe * 60 - 90;
    for (let k = 0; k < 8; k++) {
      const rr = 11 + hashRandom(s++) * 25;
      const spread = 22 * (1 - rr / 46);
      const a = base + 30 + (hashRandom(s++) - 0.5) * (44 - spread);
      const [x, y] = polar(rr, a);
      out.push([f2(x), f2(y), f2(2.1 + hashRandom(s++) * 1.5), a]);
    }
  }
  return out;
})();

/** Membrane walls between the aril lobes. */
const PITH_WALLS = Array.from({ length: 6 }, (_, i) => {
  const a = i * 60 - 90;
  const [x0, y0] = polar(3, a);
  const [x1, y1] = polar(41, a);
  return `M${f2(x0)} ${f2(y0)}L${f2(x1)} ${f2(y1)}`;
}).join("");

/** Watermelon pips, off-centre and tilted the way they sit in the flesh. */
const PIPS: [number, number, number][] = [
  [36, 40, -22],
  [58, 36, 14],
  [66, 55, 38],
  [44, 62, -8],
  [28, 56, -40],
  [52, 50, 6],
  [70, 40, 26],
  [34, 72, -18],
  [58, 72, 20],
];

const APPLE_BODY =
  "M50 24c8-8 22-9 30 1 8 10 7 27 0 42-5 11-13 18-20 18-4 0-6-2-10-2s-6 2-10 2" +
  "c-7 0-15-7-20-18-7-15-8-32 0-42 8-10 22-9 30-1Z";

const CARROT_BODY =
  "M50 30c10 0 16 5 16 10 0 11-9 52-16 52s-16-41-16-52c0-5 6-10 16-10Z";

const CARROT_FRONDS =
  "M50 31c-6-10-15-15-26-16 10-7 22-3 28 7 1-11 7-19 16-23 1 12-2 22-8 28" +
  "c9-5 19-4 27 1-11 5-23 6-30 8Z";

const MANGO_BODY =
  "M66 16c16 6 22 24 16 43-6 19-22 33-39 33-12 0-19-8-19-21 0-24 22-61 42-55Z";

/* ------------------------------------------------------------------ *
 * Palettes — the fruit's own colours, sampled from the photographs.
 * The juice accent arrives separately as `currentColor`.
 * ------------------------------------------------------------------ */

interface Palette {
  skin: string;
  skinDeep: string;
  /** The pale layer under the skin. */
  pith: string;
  flesh: string;
  fleshDeep: string;
  seed: string;
}

const PALETTE: Record<FruitKind, Palette> = {
  orange: {
    skin: "#f2901b",
    skinDeep: "#9d4c07",
    pith: "#fbe8c6",
    flesh: "#ffab2b",
    fleshDeep: "#d9760d",
    seed: "#f7e3b4",
  },
  apple: {
    skin: "#a8c62f",
    skinDeep: "#4c6410",
    pith: "#f7f2d8",
    flesh: "#f3ecc4",
    fleshDeep: "#cfc392",
    seed: "#43230c",
  },
  pineapple: {
    skin: "#a97728",
    skinDeep: "#573a0d",
    pith: "#f6e6b4",
    flesh: "#f0c231",
    fleshDeep: "#bd8a10",
    seed: "#8a6512",
  },
  carrot: {
    skin: "#e2680f",
    skinDeep: "#8c360a",
    pith: "#f8c179",
    flesh: "#ef7d17",
    fleshDeep: "#a9490b",
    seed: "#3f6a1c",
  },
  watermelon: {
    skin: "#245e2b",
    skinDeep: "#0e2d16",
    pith: "#dcecc0",
    flesh: "#e8455c",
    fleshDeep: "#a2143a",
    seed: "#25100c",
  },
  pomegranate: {
    skin: "#a51f39",
    skinDeep: "#530a1a",
    pith: "#f4ddb4",
    flesh: "#d0163a",
    fleshDeep: "#75091f",
    seed: "#8d0d26",
  },
  mango: {
    skin: "#df5f24",
    skinDeep: "#7f3110",
    pith: "#f7dfa4",
    flesh: "#f8b338",
    fleshDeep: "#cf7c14",
    seed: "#efdcae",
  },
};

/* ------------------------------------------------------------------ *
 * Faces
 * ------------------------------------------------------------------ */

interface FaceProps {
  p: Palette;
  uid: string;
  fine: boolean;
}

/** The silhouette each face is clipped and rim-lit by. */
function silhouette(kind: FruitKind, face: FruitFace): ReactElement {
  if (face === "whole") {
    switch (kind) {
      case "apple":
        return <path d={APPLE_BODY} />;
      case "mango":
        return <path d={MANGO_BODY} />;
      case "carrot":
        return <path d={CARROT_BODY} />;
      case "watermelon":
        return <ellipse cx={C} cy={C} rx="46" ry="38" />;
      case "pineapple":
        return <ellipse cx={C} cy="58" rx="34" ry="40" />;
      case "pomegranate":
        return <circle cx={C} cy="54" r="40" />;
      default:
        return <circle cx={C} cy={C} r={R} />;
    }
  }
  switch (kind) {
    case "apple":
      return <path d={APPLE_BODY} />;
    case "carrot":
      return <path d={CARROT_BODY} />;
    case "mango":
      return <ellipse cx={C} cy={C} rx="41" ry="46" />;
    case "pineapple":
      return <path d={PINEAPPLE_EDGE} />;
    default:
      return <circle cx={C} cy={C} r={R} />;
  }
}

/** Orange: peel, pith, ten segments, a pale core. The reference face. */
function CitrusFace({ p, uid, fine }: FaceProps) {
  return (
    <>
      <circle cx={C} cy={C} r={RIND_R} fill={`url(#${uid}-skin)`} />
      <circle cx={C} cy={C} r={PITH_R} fill={p.pith} />
      {/* the pith is not flat — it darkens where it turns under the peel */}
      <circle
        cx={C}
        cy={C}
        r={PITH_R - 0.9}
        fill="none"
        stroke={shade(p.pith, 0.22)}
        strokeWidth="1.8"
        strokeOpacity="0.5"
      />
      <circle cx={C} cy={C} r={FLESH_R} fill={p.fleshDeep} />
      {WHEEL_10.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={`url(#${uid}-flesh)`}
          stroke={p.pith}
          strokeOpacity="0.3"
          strokeWidth="0.5"
        />
      ))}
      {fine ? (
        <g
          stroke={tintUp(p.flesh, 0.35)}
          strokeOpacity="0.22"
          strokeWidth="0.7"
          strokeLinecap="round"
        >
          {VESICLE_10.map(([x0, y0, x1, y1], i) => (
            <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} />
          ))}
        </g>
      ) : null}
      <circle cx={C} cy={C} r="4.4" fill={p.pith} opacity="0.85" />
      {/* the flesh sits below the pith, so it catches an edge of shadow */}
      <circle
        cx={C}
        cy={C}
        r={FLESH_R - 0.5}
        fill="none"
        stroke={shade(p.fleshDeep, 0.35)}
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />
    </>
  );
}

/** Watermelon: green rind, the pale band, flesh, pips. */
function WatermelonFace({ p, uid, fine }: FaceProps) {
  return (
    <>
      <circle cx={C} cy={C} r={R} fill={`url(#${uid}-skin)`} />
      {fine ? (
        <g stroke={shade(p.skin, 0.45)} strokeWidth="2.6" fill="none">
          {[-70, -30, 10, 50, 120, 200].map((a, i) => {
            const [x0, y0] = polar(44.5, a - 7);
            const [x1, y1] = polar(44.5, a + 7);
            return (
              <path
                key={i}
                d={`M${f2(x0)} ${f2(y0)}A44.5 44.5 0 0 1 ${f2(x1)} ${f2(y1)}`}
              />
            );
          })}
        </g>
      ) : null}
      <circle cx={C} cy={C} r="40.5" fill={p.pith} />
      <circle cx={C} cy={C} r="37.5" fill={`url(#${uid}-flesh)`} />
      {fine ? (
        <g stroke={tintUp(p.flesh, 0.3)} strokeOpacity="0.28" strokeWidth="1">
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * 360;
            const [x0, y0] = polar(8, a);
            const [x1, y1] = polar(37, a);
            return (
              <line key={i} x1={f2(x0)} y1={f2(y0)} x2={f2(x1)} y2={f2(y1)} />
            );
          })}
        </g>
      ) : null}
      <g fill={p.seed}>
        {PIPS.map(([x, y, rot], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="2"
            ry="3.1"
            transform={`rotate(${rot} ${x} ${y})`}
          />
        ))}
      </g>
    </>
  );
}

/** Pomegranate: thick pith, six lobes of arils, membrane between. */
function PomegranateFace({ p, uid, fine }: FaceProps) {
  return (
    <>
      <circle cx={C} cy={C} r={R} fill={`url(#${uid}-skin)`} />
      <circle cx={C} cy={C} r="40.5" fill={p.pith} />
      <path
        d={PITH_WALLS}
        stroke={shade(p.pith, 0.12)}
        strokeWidth="3.4"
        fill="none"
      />
      <g fill={`url(#${uid}-flesh)`}>
        {ARILS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      {fine ? (
        <g fill="#fff" fillOpacity="0.5">
          {ARILS.map(([x, y, r], i) =>
            i % 2 ? null : (
              <circle key={i} cx={x - r * 0.32} cy={y - r * 0.36} r={r * 0.3} />
            ),
          )}
        </g>
      ) : null}
    </>
  );
}

/** Pineapple ring: scalloped rind, fibrous flesh, the tough core. */
function PineappleFace({ p, uid, fine }: FaceProps) {
  return (
    <>
      <path d={PINEAPPLE_EDGE} fill={`url(#${uid}-skin)`} />
      <circle cx={C} cy={C} r="40" fill={`url(#${uid}-flesh)`} />
      {fine ? (
        <g stroke={p.fleshDeep} strokeOpacity="0.34" strokeWidth="0.9">
          {PINEAPPLE_FIBRES.map(([x0, y0, x1, y1], i) => (
            <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} />
          ))}
        </g>
      ) : null}
      <circle cx={C} cy={C} r="10.5" fill={p.pith} opacity="0.85" />
      <circle cx={C} cy={C} r="10.5" fill="none" stroke={p.fleshDeep} strokeOpacity="0.4" />
    </>
  );
}

/** Mango half: flesh around a big flat stone. */
function MangoFace({ p, uid, fine }: FaceProps) {
  return (
    <>
      <ellipse cx={C} cy={C} rx="41" ry="46" fill={`url(#${uid}-skin)`} />
      <ellipse cx={C} cy={C} rx="37.5" ry="42.5" fill={`url(#${uid}-flesh)`} />
      <ellipse cx={C} cy="53" rx="15" ry="25" fill={p.seed} opacity="0.95" />
      {fine ? (
        <g stroke={p.seed} strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round">
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * 360;
            const x0 = C + 14 * Math.cos((a * Math.PI) / 180);
            const y0 = 53 + 24 * Math.sin((a * Math.PI) / 180);
            const x1 = C + 21 * Math.cos((a * Math.PI) / 180);
            const y1 = 53 + 33 * Math.sin((a * Math.PI) / 180);
            return (
              <line key={i} x1={f2(x0)} y1={f2(y0)} x2={f2(x1)} y2={f2(y1)} />
            );
          })}
        </g>
      ) : null}
    </>
  );
}

/** Apple cut lengthwise: pale flesh, a thin skin edge, the core and two pips. */
function AppleFace({ p, uid, fine }: FaceProps) {
  return (
    <>
      <path d={APPLE_BODY} fill={`url(#${uid}-flesh)`} />
      <path
        d={APPLE_BODY}
        fill="none"
        stroke={`url(#${uid}-skin)`}
        strokeWidth="4"
      />
      <path
        d="M50 30c-7 9-7 32 0 44 7-12 7-35 0-44Z"
        fill={shade(p.flesh, 0.1)}
        stroke={p.fleshDeep}
        strokeOpacity="0.6"
        strokeWidth="0.8"
      />
      <g fill={p.seed}>
        <ellipse cx="46.5" cy="50" rx="2.1" ry="3.4" transform="rotate(-14 46.5 50)" />
        <ellipse cx="53.5" cy="50" rx="2.1" ry="3.4" transform="rotate(14 53.5 50)" />
      </g>
      {fine ? (
        <path
          d="M50 30V16"
          stroke={p.skinDeep}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ) : null}
    </>
  );
}

/** Carrot, whole. Nobody pictures half a carrot. */
function CarrotFace({ p, uid, fine }: FaceProps) {
  return (
    <>
      <path d={CARROT_FRONDS} fill={p.seed} opacity="0.9" />
      <path d={CARROT_BODY} fill={`url(#${uid}-flesh)`} />
      {fine ? (
        <g stroke={p.skinDeep} strokeOpacity="0.35" strokeWidth="1.2" fill="none">
          <path d="M38 46q12 4 24 0" />
          <path d="M39 60q11 4 22 0" />
          <path d="M41 74q9 3 18 0" />
        </g>
      ) : null}
      <path
        d="M44 34c-2 18-1 40 3 56"
        stroke={tintUp(p.flesh, 0.4)}
        strokeOpacity="0.4"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

/** Uncut fruit for the far field — mass and one highlight, nothing more. */
function WholeFace({
  kind,
  p,
  uid,
  fine,
}: FaceProps & { kind: FruitKind }): ReactElement {
  const skin = `url(#${uid}-skin)`;
  switch (kind) {
    case "apple":
      return (
        <>
          <path d={APPLE_BODY} fill={skin} />
          <path
            d="M53 16c7-7 16-8 22-6-2 7-9 13-16 13-3 0-5-3-6-7Z"
            fill={p.skinDeep}
          />
          <path d="M50 25V14" stroke={p.skinDeep} strokeWidth="2.6" />
        </>
      );
    case "mango":
      return (
        <>
          <path d={MANGO_BODY} fill={skin} />
          {fine ? (
            <path
              d="M60 30C48 38 38 52 33 68"
              stroke={p.skinDeep}
              strokeOpacity="0.4"
              strokeWidth="2"
              fill="none"
            />
          ) : null}
        </>
      );
    case "carrot":
      return <CarrotFace p={p} uid={uid} fine={fine} />;
    case "watermelon":
      return (
        <>
          <ellipse cx={C} cy={C} rx="46" ry="38" fill={skin} />
          <g stroke={p.skinDeep} strokeWidth="4.5" fill="none" opacity="0.75">
            {[-26, -8, 10, 28].map((o, i) => (
              <path
                key={i}
                d={`M${50 + o * 1.3} 13c-6 12-6 50 0 74`}
                transform={`rotate(${o * 0.5} 50 50)`}
              />
            ))}
          </g>
        </>
      );
    case "pineapple":
      return (
        <>
          <path
            d="M50 24c-4-11-11-18-21-21 11-3 20 2 24 10 3-10 9-16 19-19-2 12-6 21-12 27Z"
            fill={p.seed}
          />
          <ellipse cx={C} cy="58" rx="34" ry="40" fill={skin} />
          {fine ? (
            <g stroke={p.skinDeep} strokeOpacity="0.5" strokeWidth="1">
              {[0, 1, 2, 3].map((r) =>
                [0, 1, 2, 3, 4].map((c) => (
                  <path
                    key={`${r}-${c}`}
                    d={`M${24 + c * 13} ${34 + r * 16}l6 8-6 8-6-8Z`}
                    fill="none"
                  />
                )),
              )}
            </g>
          ) : null}
        </>
      );
    case "pomegranate":
      return (
        <>
          <circle cx={C} cy="54" r="40" fill={skin} />
          <path
            d="M44 18h12l-2 6 5-3-1 7 6-2-5 6h7l-7 4h-18l-7-4h7l-5-6 6 2-1-7 5 3Z"
            fill={p.skinDeep}
          />
        </>
      );
    default:
      return (
        <>
          <circle cx={C} cy={C} r={R} fill={skin} />
          {fine ? (
            <g fill={p.skinDeep} fillOpacity="0.2">
              {Array.from({ length: 16 }, (_, i) => {
                const a = hashRandom(i * 3 + 1) * 360;
                const rr = 8 + hashRandom(i * 5 + 2) * 32;
                const [x, y] = polar(rr, a);
                return <circle key={i} cx={f2(x)} cy={f2(y)} r="1.5" />;
              })}
            </g>
          ) : null}
          <path
            d="M53 12c8-9 19-11 26-9-2 9-10 16-19 17-4 0-6-3-7-8Z"
            fill="#3f6a1c"
            opacity="0.85"
          />
        </>
      );
  }
}

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

export interface FruitArtProps {
  kind: FruitKind;
  face?: FruitFace;
  /** Number for CSS pixels, or a string such as "100%" to fill a box. */
  size?: number | string;
  uid: string;
  className?: string;
  opacity?: number;
  /** `simple` drops the fine texture, for small or defocused pieces. */
  detail?: "full" | "simple";
}

export function FruitArt({
  kind,
  face = "cut",
  size = "100%",
  uid,
  className = "",
  opacity = 1,
  detail = "full",
}: FruitArtProps) {
  const p = PALETTE[kind] ?? PALETTE.orange;
  const fine = detail === "full";
  const sil = silhouette(kind, face);

  let body: ReactElement;
  if (face === "whole") {
    body = <WholeFace kind={kind} p={p} uid={uid} fine={fine} />;
  } else {
    switch (kind) {
      case "watermelon":
        body = <WatermelonFace p={p} uid={uid} fine={fine} />;
        break;
      case "pomegranate":
        body = <PomegranateFace p={p} uid={uid} fine={fine} />;
        break;
      case "pineapple":
        body = <PineappleFace p={p} uid={uid} fine={fine} />;
        break;
      case "mango":
        body = <MangoFace p={p} uid={uid} fine={fine} />;
        break;
      case "apple":
        body = <AppleFace p={p} uid={uid} fine={fine} />;
        break;
      case "carrot":
        body = <CarrotFace p={p} uid={uid} fine={fine} />;
        break;
      default:
        body = <CitrusFace p={p} uid={uid} fine={fine} />;
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ display: "block", opacity, overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`${uid}-flesh`} cx="0.36" cy="0.28" r="0.82">
          <stop offset="0" stopColor={tintUp(p.flesh, 0.1)} />
          <stop offset="0.55" stopColor={p.flesh} />
          <stop offset="1" stopColor={p.fleshDeep} />
        </radialGradient>
        <linearGradient id={`${uid}-skin`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={tintUp(p.skin, 0.28)} />
          <stop offset="0.5" stopColor={p.skin} />
          <stop offset="1" stopColor={p.skinDeep} />
        </linearGradient>
        {/* Key light from the upper left, matching the rest of the scene.
            Kept tight and weak: a broad white wash over the whole face is
            what turns a vivid orange into a pale wheel. */}
        <radialGradient id={`${uid}-gloss`} cx="0.3" cy="0.22" r="0.44">
          <stop offset="0" stopColor="#fff8e6" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#fff8e6" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff8e6" stopOpacity="0" />
        </radialGradient>
        {/* Everything falls away from that light toward the lower right. */}
        <linearGradient id={`${uid}-shade`} x1="0.2" y1="0.1" x2="0.95" y2="1">
          <stop offset="0.35" stopColor="#0a0704" stopOpacity="0" />
          <stop offset="1" stopColor="#0a0704" stopOpacity="0.62" />
        </linearGradient>
        {/* The selected juice, washed over the whole piece. Inherited as
            `color`, so a flavour change is a CSS transition on an ancestor
            rather than a re-render of every fruit in the scene. */}
        <linearGradient id={`${uid}-cast`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.06" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.34" />
        </linearGradient>
        {/* Rim: bright where the key strikes the edge, gone by the shadow side. */}
        <linearGradient id={`${uid}-rim`} x1="0.05" y1="0" x2="0.8" y2="0.95">
          <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.85" />
          <stop offset="0.42" stopColor="#d4a63c" stopOpacity="0.18" />
          <stop offset="0.75" stopColor="#d4a63c" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${uid}-sil`}>{sil}</clipPath>
      </defs>

      <g clipPath={`url(#${uid}-sil)`}>
        {body}
        <rect x="0" y="0" width="100" height="100" fill={`url(#${uid}-cast)`} />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${uid}-shade)`} />
        <rect x="0" y="0" width="100" height="100" fill={`url(#${uid}-gloss)`} />
      </g>

      {/* Rim last and unclipped, so the stroke sits on the silhouette edge. */}
      <g fill="none" stroke={`url(#${uid}-rim)`} strokeWidth="1.5">
        {sil}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Juice, moving
 * ------------------------------------------------------------------ */

/**
 * Juice caught mid-throw around the foot of the bottle: a shallow pool, one
 * sheet peeling up on the lit side, a low ripple on the other, and droplets
 * hanging over it.
 *
 * Drawn wide and shallow (400×220, the contact line at y=152) so it can be
 * dropped straight onto the hero's floor line, and drawn to sit BEHIND the
 * bottle — the middle third is never seen, which is why nothing here is
 * symmetrical about it. A matched pair of wings either side reads as a crest
 * on a coat of arms, not as liquid.
 *
 * Cold-pressed juice is opaque: in `05-watermelon-pour.jpeg` the pour is a
 * solid pink ribbon with one specular edge, nothing like translucent water.
 * So the fills are solid and the only transparency is at the pool's edge.
 *
 * Colour comes from the inherited `color`, so it re-tints with a transition.
 * `[data-splash-drop]` marks the droplets for the hero's frame loop; nothing
 * animates itself.
 */
export function JuiceSplash({
  uid,
  className = "",
  detail = "full",
}: {
  uid: string;
  className?: string;
  detail?: "full" | "simple";
}) {
  const fine = detail === "full";
  return (
    <svg
      viewBox="0 0 400 220"
      width="100%"
      height="100%"
      aria-hidden="true"
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${uid}-sheet`} x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="currentColor" stopOpacity="0.62" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`${uid}-pool`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.42" />
          <stop offset="0.5" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the pool, sitting on the floor line */}
      <ellipse cx="196" cy="152" rx="180" ry="26" fill={`url(#${uid}-pool)`} />
      {/* two rings still running out from where the bottle went down */}
      <ellipse
        cx="198"
        cy="152"
        rx="118"
        ry="17"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />
      <ellipse
        cx="198"
        cy="153"
        rx="152"
        ry="22"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="1.6"
      />

      {/* The crown. Low, uneven tongues around the foot — most of it is
          hidden behind the bottle, and the ones that show are different
          heights on purpose. A matched pair of tall sheets either side reads
          as an ornament rather than as liquid.

          Each tongue is wide where it leaves the pool and narrows to a
          *rounded* tip, which is what surface tension actually does to
          thrown liquid. Drawn as sharp closed triangles instead, they stop
          being juice and start being pennants. */}
      <path
        d={
          "M92 154C94 143 99 134 106 128C110 125 114 127 112 133C109 142 106 149 104 154Z" +
          "M116 156C119 142 126 129 136 120C141 116 146 119 143 126C138 138 132 148 129 156Z" +
          "M258 156C262 141 271 128 282 119C287 115 292 118 289 125C283 137 276 147 272 156Z" +
          "M288 154C293 143 302 133 312 127C317 124 321 127 318 133C312 142 304 149 298 154Z" +
          "M316 152C324 145 334 140 344 138C349 137 351 141 347 145C340 150 331 153 324 154Z" +
          "M70 152C64 146 58 140 54 133C51 129 55 126 59 130C66 136 72 143 76 150Z"
        }
        fill={`url(#${uid}-sheet)`}
      />
      {/* the light catches the leading edge of the two tallest tongues */}
      <path
        d="M124 148C128 137 133 128 139 122M268 150C273 138 279 128 286 121"
        fill="none"
        stroke="#fff3d6"
        strokeOpacity="0.4"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* droplets thrown clear — the hero drifts these */}
      <g fill="currentColor">
        <ellipse data-splash-drop="0" cx="352" cy="62" rx="5" ry="6.2" />
        <ellipse data-splash-drop="1" cx="318" cy="104" rx="3.2" ry="4" />
        <ellipse data-splash-drop="2" cx="88" cy="112" rx="3.8" ry="4.6" />
        {fine ? (
          <>
            <ellipse data-splash-drop="3" cx="380" cy="118" rx="2.4" ry="3" />
            <ellipse data-splash-drop="4" cx="46" cy="132" rx="2.2" ry="2.8" />
            <ellipse data-splash-drop="5" cx="336" cy="26" rx="3" ry="3.8" />
          </>
        ) : null}
      </g>
      {fine ? (
        <g fill="#fff3d6" fillOpacity="0.7">
          <circle cx="350" cy="59" r="1.6" />
          <circle cx="86" cy="109" r="1.2" />
        </g>
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Ice
 * ------------------------------------------------------------------ */

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
