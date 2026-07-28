"use client";

/**
 * The Juice Cartel 330ml bottle, drawn as vector.
 *
 * Traced from the photographs in `docs/reference/bottles/` rather than from a
 * description of them — see that folder's README. The product is a clear PET
 * milk bottle / carafe: a tall ribbed cap in translucent natural white, a short
 * threaded neck, a long conical shoulder, a near straight-walled body, and a
 * circular black-and-gold label that spans most of the body width.
 *
 * Everything is inline SVG with plain gradients — no SVG filters, no
 * <feGaussianBlur>, because a filter on a moving element re-rasterises every
 * frame and this thing has to hold 60fps on a £150 Android.
 *
 * The parts that move are tagged with data attributes rather than animated
 * here, so the hero's single rAF loop can find them and write transforms:
 *
 *   [data-bubble]  rising bubbles, one per {@link bubbleSpecs} entry
 *   [data-spec]    the specular highlight, slid sideways to fake Y rotation
 *   [data-bounce]  the softer bounce light on the opposite side
 *   [data-sweep]   the gold sweep that travels across the label
 *
 * Every gradient and clip id is namespaced with `uid` so several bottles can
 * share a document without stealing each other's paint servers.
 */

import { hashRandom } from "./useHeroMotion";

/* ---------------- geometry ----------------
 * One place to change the silhouette. All coordinates are in the 200×556
 * user space of the viewBox.
 *
 * Everything below is measured off `01-three-bottles-straight-on.jpeg`, using
 * the left-hand bottle (the largest one with a clean, unoccluded left edge)
 * and normalising by its body width. The photographed bottle is 2.78 body
 * widths tall including the cap, so the viewBox is sized to bound the drawing
 * tightly: a caller who sizes by BOTTLE_RATIO then gets the real proportions
 * rather than the proportions of a box with the bottle rattling around inside.
 */
export const VB_W = 200;
export const VB_H = 556;
/** Bottle art is 200 wide by 556 tall; scenes size by width and derive height. */
export const BOTTLE_RATIO = VB_H / VB_W;

/**
 * Top of the cap. The base the bottle stands on is y=542, so the drawing is
 * 528 tall against a body 190 wide (x 5..195) — the photographed 2.78:1.
 */
const CAP_TOP = 14;

/** Cap: 0.27 body widths tall, 0.66 wide — a 38mm closure on a 65mm bottle. */
const CAP_BOTTOM = 64;
const CAP_R = 63;
/** The knurling stops well short of the tamper band, as it does on the real cap. */
const RIB_TOP = 19;
const RIB_BOTTOM = 45;
const RIB_COUNT = 41;

/**
 * Neck: the two thread turns that clear the closure skirt, then the support
 * ring it seals against. Only ~3% of the real bottle's height shows below the
 * cap, and the juice comes up behind it, so the threads read as pale ridges
 * over colour — not as the bare grey coil you get if you draw them against the
 * hero's black ground.
 */
const NECK_R = 57;
const NECK_RING_TOP = 84;
const NECK_RING_BOTTOM = 92;
const NECK_RING_R = 59;
const THREAD_YS = [65, 74];

/**
 * Surface of the juice. The real bottles are filled to the base of the neck —
 * the whole shoulder is full — and carry a pale foam / pulp head about 0.17 of
 * the bottle's height deep. A flat slab starting below the shoulder is what
 * made the old drawing read as squash.
 */
const LIQUID_TOP = 96;
const LIQUID_BOTTOM = 536;
const LIQUID_SPAN = LIQUID_BOTTOM - LIQUID_TOP;
const FOAM_BOTTOM = 184;
/** Inner radius at the surface — the shoulder is still closing in up here. */
const LIQUID_TOP_R = 53;

/** Label: 0.87 body widths across, centred 1.56 body widths below the cap. */
const LABEL_CX = 100;
const LABEL_CY = 310;
const LABEL_R = 76;

/** `JC.`, printed white on the glass 0.82 label-diameters below the label. */
const JC_BASELINE = 448;

/**
 * Outer glass silhouette — the cap sits on top of this.
 *
 * The shoulder is the part everyone draws wrong. It is not a tight radius: it
 * leaves the neck fast and then eases for the better part of a body width
 * before it meets the straight wall, which is why the cubic's first control
 * point is so far out and its second is so far down.
 */
const BODY_PATH =
  "M157 64 L157 92 " +
  "C160 104 191 164 195 250 " +
  "L193.5 496 C193.5 524 185 542 163 542 " +
  "L37 542 C15 542 6.5 524 6.5 496 " +
  "L5 250 C9 164 40 104 43 92 " +
  "L43 64 Z";

/** Inner void, inset for glass thickness. Clips the liquid and the droplets. */
const INNER_PATH =
  "M152 64 L152 92 " +
  "C155 105 186 165 190 251 " +
  "L188.5 494 C188.5 518 181 536 161 536 " +
  "L39 536 C19 536 11.5 518 11.5 494 " +
  "L10 251 C14 165 45 105 48 92 " +
  "L48 64 Z";

/* ---------------- bubbles ---------------- */

export interface BubbleSpec {
  x: number;
  r: number;
  /** User units per second. */
  speed: number;
  /** 0..1 starting position along the rise. */
  phase: number;
  /** Horizontal wobble amplitude. */
  wobble: number;
}

/**
 * Deterministic bubble layout. Shared by the art (which renders the circles)
 * and the hero loop (which moves them), so both agree without prop drilling.
 */
export function bubbleSpecs(seed: number, count: number): BubbleSpec[] {
  const out: BubbleSpec[] = [];
  for (let i = 0; i < count; i++) {
    const a = hashRandom(seed * 13.7 + i * 3.1);
    const b = hashRandom(seed * 7.3 + i * 9.4 + 41);
    const c = hashRandom(seed * 3.9 + i * 5.6 + 97);
    const d = hashRandom(seed * 11.1 + i * 2.2 + 173);
    out.push({
      x: 34 + a * 132,
      r: 1.2 + b * 2.6,
      speed: 14 + c * 24,
      phase: d,
      wobble: 1.5 + a * 4,
    });
  }
  return out;
}

export const BUBBLE_RISE = LIQUID_SPAN;
export const BUBBLE_BASE_Y = LIQUID_BOTTOM - 4;
export const BUBBLE_TOP_Y = LIQUID_TOP;

/* ---------------- foam head ---------------- */

interface FoamCell {
  x: number;
  y: number;
  r: number;
  o: number;
}

/**
 * The pulp head that sits on fresh pressed juice: a raft of pale cells rather
 * than a smooth band, densest just under the surface. Deterministic so a
 * bottle looks the same on every render and between server and client.
 */
function foamCells(seed: number, count: number): FoamCell[] {
  const out: FoamCell[] = [];
  const span = FOAM_BOTTOM - LIQUID_TOP;
  for (let i = 0; i < count; i++) {
    const a = hashRandom(seed * 6.2 + i * 3.7 + 11);
    const b = hashRandom(seed * 4.1 + i * 8.3 + 59);
    const c = hashRandom(seed * 9.7 + i * 1.9 + 131);
    /* Bias upwards: b*b lands most cells in the top third of the head. */
    const t = b * b;
    out.push({
      x: 22 + a * 156,
      y: LIQUID_TOP + 3 + t * (span - 6),
      r: 1 + c * 2.6,
      o: 0.16 + (1 - t) * 0.34,
    });
  }
  return out;
}

/* ---------------- condensation ---------------- */

interface Droplet {
  x: number;
  y: number;
  r: number;
  o: number;
}

function droplets(seed: number, count: number): Droplet[] {
  const out: Droplet[] = [];
  for (let i = 0; i < count * 4 && out.length < count; i++) {
    const x = 18 + hashRandom(seed * 5.1 + i * 1.7) * 164;
    const y = 150 + hashRandom(seed * 2.3 + i * 4.9 + 13) * 370;
    /* Keep the glass clear over the label, or the type stops being legible. */
    const dx = x - LABEL_CX;
    const dy = y - LABEL_CY;
    if (dx * dx + dy * dy < (LABEL_R + 8) * (LABEL_R + 8)) continue;
    out.push({
      x,
      y,
      r: 1 + hashRandom(seed * 8.8 + i * 2.6 + 57) * 3,
      o: 0.2 + hashRandom(seed * 4.4 + i * 6.3 + 91) * 0.32,
    });
  }
  return out;
}

/* ---------------- label ---------------- */

function Label({
  uid,
  arcs,
  arcClassName,
  detail,
}: {
  uid: string;
  arcs: boolean;
  arcClassName?: string;
  detail: LabelDetail;
}) {
  const gold = "#d4a63c";
  const goldPale = "#f2e3b4";
  const full = detail === "full";

  return (
    <g>
      {/* black disc */}
      <circle cx={LABEL_CX} cy={LABEL_CY} r={LABEL_R} fill={`url(#${uid}-lab)`} />
      {/* One thin gold ring, set in from the edge. The real sticker has no
          second hairline — that was invented. */}
      <circle
        cx={LABEL_CX}
        cy={LABEL_CY}
        r={LABEL_R - 5.5}
        fill="none"
        stroke={`url(#${uid}-ring)`}
        strokeWidth="1.5"
      />

      {arcs ? (
        <g className={arcClassName}>
          <defs>
            <path
              id={`${uid}-arc-top`}
              d={`M ${LABEL_CX - 59} ${LABEL_CY} A 59 59 0 0 1 ${LABEL_CX + 59} ${LABEL_CY}`}
              fill="none"
            />
            {/* Drawn right-to-left round the bottom so the type sits upright
                the way it does on the real label, and pushed out to r=68 so
                it clears the "330ml" line entirely. */}
            <path
              id={`${uid}-arc-bot`}
              d={`M ${LABEL_CX - 66} ${LABEL_CY} A 66 66 0 0 0 ${LABEL_CX + 66} ${LABEL_CY}`}
              fill="none"
            />
          </defs>
          {/* All the label type is a serif on the real sticker, including the
              two arcs — they were sans here. */}
          <text
            fill={gold}
            fontSize="7.4"
            letterSpacing="1.8"
            fontFamily="var(--font-playfair), Georgia, serif"
          >
            <textPath href={`#${uid}-arc-top`} startOffset="50%" textAnchor="middle">
              FRESHLY MADE
            </textPath>
          </text>
          <text
            fill={gold}
            fontSize="6.6"
            letterSpacing="0.4"
            fontFamily="var(--font-playfair), Georgia, serif"
            opacity="0.92"
          >
            <textPath href={`#${uid}-arc-bot`} startOffset="50%" textAnchor="middle">
              Apart of EK Entrepreneurship
            </textPath>
          </text>
        </g>
      ) : null}

      {/* the gold line-art bottle from the packaging. On the small orbit
          bottles it grows to fill the disc, because the wordmark under it
          would only ever be four pixels of grey mush. */}
      <g
        transform={
          full
            ? `translate(${LABEL_CX} ${LABEL_CY - 28}) scale(0.44) translate(-32 -43)`
            : `translate(${LABEL_CX} ${LABEL_CY}) scale(1) translate(-32 -43)`
        }
        stroke={gold}
        fill={gold}
      >
        <rect x="22" y="3" width="20" height="9" rx="2.5" stroke="none" />
        <path d="M26 12h12v6H26z" stroke="none" opacity="0.9" />
        <path
          d="M26 18c0 3.5-11 7.5-11 14v45a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6V32c0-6.5-11-10.5-11-14"
          fill="none"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 41c4.5 0 6.5-2.6 11-2.6s6.5 2.6 11 2.6 6.5-2.6 9-2.6"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M32 52c0 0-7 7.2-7 11.6a7 7 0 0 0 14 0C39 59.2 32 52 32 52Z"
          stroke="none"
        />
      </g>

      {/* wordmark, two lines, gold serif. Both lines are the same size on the
          real label; JUICE is tracked out to match CARTEL's width. */}
      {full ? (
        <>
          <text
            x={LABEL_CX}
            y={LABEL_CY + 12}
            textAnchor="middle"
            fill={`url(#${uid}-foil)`}
            fontSize="19"
            letterSpacing="3.2"
            fontFamily="var(--font-playfair), Georgia, serif"
            fontWeight="500"
          >
            JUICE
          </text>
          <text
            x={LABEL_CX}
            y={LABEL_CY + 30}
            textAnchor="middle"
            fill={`url(#${uid}-foil)`}
            fontSize="19"
            letterSpacing="0.7"
            fontFamily="var(--font-playfair), Georgia, serif"
            fontWeight="500"
          >
            CARTEL
          </text>
          <text
            x={LABEL_CX}
            y={LABEL_CY + 50}
            textAnchor="middle"
            fill={goldPale}
            fontSize="9"
            letterSpacing="0.8"
            fontFamily="var(--font-playfair), Georgia, serif"
          >
            330ml
          </text>
        </>
      ) : null}

      {/* travelling foil sweep, clipped to the disc */}
      <g clipPath={`url(#${uid}-labclip)`}>
        <rect
          data-sweep=""
          x={LABEL_CX - LABEL_R - 100}
          y={LABEL_CY - LABEL_R - 12}
          width="52"
          height={LABEL_R * 2 + 24}
          fill={`url(#${uid}-sweep)`}
          transform="rotate(-16)"
          style={{ transformOrigin: `${LABEL_CX}px ${LABEL_CY}px` }}
        />
      </g>
    </g>
  );
}

/* ---------------- the bottle ---------------- */

export type LabelDetail = "full" | "mark" | "none";

export interface BottleArtProps {
  /**
   * Rendered width. A number is CSS pixels and the height is derived from
   * {@link BOTTLE_RATIO}; a string such as "100%" lets the bottle fill a
   * container that already has the right aspect ratio, which is how the hero
   * scales every bottle without measuring anything.
   */
  width?: number | string;
  height?: number | string;
  accent: string;
  accentDeep: string;
  /** Unique per instance — namespaces gradient and clip ids. */
  uid: string;
  /** Seed for condensation and bubble layout, so bottles differ. */
  seed?: number;
  bubbles?: number;
  dropletCount?: number;
  /** `full` is the real label; `mark` keeps ring + bottle icon only. */
  labelDetail?: LabelDetail;
  /** Render the two arcs of type. Illegible under ~120px of bottle. */
  arcs?: boolean;
  /** Applied to the arc group, so a breakpoint can drop them. */
  arcClassName?: string;
  className?: string;
  title?: string;
}

export function BottleArt({
  width = "100%",
  height,
  accent,
  accentDeep,
  uid,
  seed = 1,
  bubbles = 0,
  dropletCount = 14,
  labelDetail = "full",
  arcs,
  arcClassName,
  className = "",
  title,
}: BottleArtProps) {
  const showLabel = labelDetail !== "none";
  const showArcs =
    showLabel &&
    labelDetail === "full" &&
    (arcs ?? (typeof width === "number" ? width >= 120 : true));
  const showFine = labelDetail === "full";
  const bubbleList = bubbles > 0 ? bubbleSpecs(seed, bubbles) : [];
  const drops = dropletCount > 0 ? droplets(seed, dropletCount) : [];
  const foam = foamCells(seed, dropletCount > 0 ? 54 : 24);
  const h =
    height ?? (typeof width === "number" ? width * BOTTLE_RATIO : "100%");

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={h}
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      style={{ display: "block", overflow: "visible" }}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <clipPath id={`${uid}-inner`}>
          <path d={INNER_PATH} />
        </clipPath>
        <clipPath id={`${uid}-body`}>
          <path d={BODY_PATH} />
        </clipPath>
        <clipPath id={`${uid}-labclip`}>
          <circle cx={LABEL_CX} cy={LABEL_CY} r={LABEL_R - 2} />
        </clipPath>

        {/* Juice. Nearly flat, then a fall over the last fifth: sampling a
            column down the photographs shows the colour holding almost constant
            and only dropping where the heel turns away from the light. The old
            half-and-half ramp turned every flavour to gravy at the base. */}
        <linearGradient id={`${uid}-juice`} x1="0" y1={LIQUID_TOP} x2="0" y2={LIQUID_BOTTOM} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={accent} />
          <stop offset="0.78" stopColor={accent} />
          <stop offset="1" stopColor={accentDeep} />
        </linearGradient>

        {/* The pulp head, as white laid over the juice rather than a second
            colour: it has to work for every flavour without the catalogue
            carrying a third hex. Nearly flat, then a fast fall at the bottom —
            fresh juice separates along a visible line. */}
        <linearGradient id={`${uid}-foam`} x1="0" y1={LIQUID_TOP} x2="0" y2={FOAM_BOTTOM} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.24" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>

        {/* cylinder shading: dark at both edges, open in the middle */}
        <linearGradient id={`${uid}-cyl`} x1="5" y1="0" x2="195" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.16" stopColor="#000" stopOpacity="0.12" />
          <stop offset="0.4" stopColor="#000" stopOpacity="0" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>

        {/* empty glass above the juice */}
        <linearGradient id={`${uid}-glass`} x1="5" y1="0" x2="195" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7f1e4" stopOpacity="0.10" />
          <stop offset="0.35" stopColor="#f7f1e4" stopOpacity="0.03" />
          <stop offset="0.78" stopColor="#f7f1e4" stopOpacity="0.05" />
          <stop offset="1" stopColor="#f7f1e4" stopOpacity="0.13" />
        </linearGradient>

        {/* empty neck: brighter than the body's glass, because there is no
            juice behind it to darken it and it is the narrowest part of the
            bottle, so it picks up light from both sides at once */}
        <linearGradient id={`${uid}-neck`} x1={100 - NECK_R} y1="0" x2={100 + NECK_R} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e6dfcd" stopOpacity="0.58" />
          <stop offset="0.22" stopColor="#fbf7ec" stopOpacity="0.34" />
          <stop offset="0.55" stopColor="#fbf7ec" stopOpacity="0.24" />
          <stop offset="0.82" stopColor="#f2ebda" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ded6c2" stopOpacity="0.62" />
        </linearGradient>

        {/* a thread turn seen edge-on: bright crest, shaded underside */}
        <linearGradient id={`${uid}-thread`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="0.34" stopColor="#ffffff" stopOpacity="0.58" />
          <stop offset="0.72" stopColor="#e7dfcd" stopOpacity="0.34" />
          <stop offset="1" stopColor="#8d8674" stopOpacity="0.3" />
        </linearGradient>

        {/* hard specular down one side */}
        <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.72" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        {/* the same streak faded top and bottom so it does not look pasted on */}
        <linearGradient id={`${uid}-specv`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.72" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        {/* warm bounce off the opposite side */}
        <linearGradient id={`${uid}-bounce`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f3da8b" stopOpacity="0" />
          <stop offset="0.5" stopColor="#f3da8b" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f3da8b" stopOpacity="0" />
        </linearGradient>

        {/* gold rim light along the glass edge */}
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3da8b" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#d4a63c" stopOpacity="0.32" />
          <stop offset="1" stopColor="#8a6015" stopOpacity="0.45" />
        </linearGradient>

        {/* Cap: translucent natural-white PET, not metal. Warm off-white in the
            middle falling to a dull putty at both edges — the old white-to-grey
            ramp read as an aluminium crown. */}
        <linearGradient id={`${uid}-cap`} x1={100 - CAP_R} y1="0" x2={100 + CAP_R} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9d968a" />
          <stop offset="0.09" stopColor="#d9d3c6" />
          <stop offset="0.3" stopColor="#f1ede3" />
          <stop offset="0.46" stopColor="#f8f5ec" />
          <stop offset="0.68" stopColor="#ece7db" />
          <stop offset="0.88" stopColor="#c3bcac" />
          <stop offset="1" stopColor="#8f887c" />
        </linearGradient>

        <linearGradient id={`${uid}-lab`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#141210" />
          <stop offset="0.55" stopColor="#0a0908" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>

        <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#f7e6ae" />
          <stop offset="0.35" stopColor="#d4a63c" />
          <stop offset="0.6" stopColor="#8a6015" />
          <stop offset="1" stopColor="#f0d68a" />
        </linearGradient>

        <linearGradient id={`${uid}-foil`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#f7e6ae" />
          <stop offset="0.4" stopColor="#d4a63c" />
          <stop offset="0.72" stopColor="#a97c1e" />
          <stop offset="1" stopColor="#f0d68a" />
        </linearGradient>

        <linearGradient id={`${uid}-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f7e6ae" stopOpacity="0" />
          <stop offset="0.5" stopColor="#f7e6ae" stopOpacity="0.30" />
          <stop offset="1" stopColor="#f7e6ae" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`${uid}-meniscus`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* ---- glass body ---- */}
      <path d={BODY_PATH} fill={`url(#${uid}-glass)`} />

      {/* ---- juice ---- */}
      <g clipPath={`url(#${uid}-inner)`}>
        <rect
          x="0"
          y={LIQUID_TOP}
          width="200"
          height={LIQUID_SPAN + 12}
          fill={`url(#${uid}-juice)`}
        />

        {/* bubbles ride inside the juice; the hero loop moves them */}
        {bubbleList.map((b, i) => (
          <circle
            key={i}
            data-bubble={i}
            cx={b.x}
            cy={BUBBLE_BASE_Y}
            r={b.r}
            fill="#fff"
            opacity="0.45"
          />
        ))}

        {/* ---- foam / pulp head ----
             Drawn before the cylinder shading so it darkens at the edges with
             the rest of the liquid instead of floating on top of it. */}
        <rect
          x="0"
          y={LIQUID_TOP}
          width="200"
          height={FOAM_BOTTOM - LIQUID_TOP}
          fill={`url(#${uid}-foam)`}
        />
        {foam.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} fill="#fff" opacity={f.o} />
        ))}
        {/* The line the juice settles out along. Pale above, deep below —
            without both edges it reads as a scratch rather than an interface. */}
        <rect x="0" y={FOAM_BOTTOM - 2.4} width="200" height="2.4" fill="#fff" opacity="0.14" />
        <rect x="0" y={FOAM_BOTTOM} width="200" height="3" fill={accentDeep} opacity="0.4" />

        {/* meniscus where the surface climbs the glass */}
        <ellipse
          cx="100"
          cy={LIQUID_TOP}
          rx={LIQUID_TOP_R}
          ry="6"
          fill={`url(#${uid}-meniscus)`}
        />
        <ellipse
          cx="100"
          cy={LIQUID_TOP + 1.2}
          rx={LIQUID_TOP_R - 2}
          ry="4.6"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.55"
          strokeWidth="1.1"
        />

        {/* cylinder shading over the juice so it is not a flat slab */}
        <rect
          x="0"
          y={LIQUID_TOP - 2}
          width="200"
          height={LIQUID_SPAN + 14}
          fill={`url(#${uid}-cyl)`}
        />

        {/* dense settle at the very bottom */}
        <rect
          x="0"
          y={LIQUID_BOTTOM - 44}
          width="200"
          height="50"
          fill={accentDeep}
          opacity="0.28"
        />
      </g>

      {/* ---- condensation ---- */}
      {drops.length > 0 ? (
        <g clipPath={`url(#${uid}-body)`}>
          {drops.map((d, i) => (
            <g key={i}>
              <ellipse
                cx={d.x}
                cy={d.y}
                rx={d.r}
                ry={d.r * 1.25}
                fill="#ffffff"
                opacity={d.o}
              />
              <circle
                cx={d.x - d.r * 0.3}
                cy={d.y - d.r * 0.4}
                r={d.r * 0.35}
                fill="#ffffff"
                opacity={Math.min(0.85, d.o * 2.4)}
              />
            </g>
          ))}
        </g>
      ) : null}

      {/* ---- lighting ---- */}
      <g clipPath={`url(#${uid}-body)`}>
        {/* The photographed highlight is a narrow band about a tenth of the
            body across, not the wide blade this used to be. */}
        <g data-spec="">
          <rect
            x="26"
            y="120"
            width="20"
            height="386"
            rx="10"
            fill={`url(#${uid}-spec)`}
            opacity="0.85"
          />
          <rect
            x="26"
            y="120"
            width="20"
            height="386"
            rx="10"
            fill={`url(#${uid}-specv)`}
            opacity="0.35"
          />
          {/* a second, tighter catch keeps the glass from looking matte */}
          <rect
            x="33"
            y="170"
            width="5"
            height="320"
            rx="2.5"
            fill="#ffffff"
            opacity="0.32"
          />
        </g>
        {/* Bounce starts below the shoulder: run it any higher and the
            rounded cap of the rect reads as a bright blob floating in the
            empty glass. */}
        <g data-bounce="">
          <rect
            x="148"
            y="238"
            width="26"
            height="272"
            rx="13"
            fill={`url(#${uid}-bounce)`}
            opacity="0.8"
          />
        </g>
      </g>

      {/* ---- glass edge ----
           Two passes: a warm gold rim so the bottle separates from the black
           ground, then a brighter white catch on the lit side only. */}
      <path
        d={BODY_PATH}
        fill="none"
        stroke={`url(#${uid}-rim)`}
        strokeWidth="1.8"
      />
      <path
        d="M43 64 L43 92 C40 104 9 164 5 250 L6.5 496"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.42"
        strokeWidth="1.3"
      />
      <path
        d="M195 250 L193.5 496 C193.5 524 185 542 163 542"
        fill="none"
        stroke="#f3da8b"
        strokeOpacity="0.5"
        strokeWidth="1.3"
      />

      {/* ---- neck ----
           Screw threads, then the support ring the closure seals against. On
           the real bottle the skirt hides most of the thread, but the turns
           that show under it do an outsized share of the work of looking like a
           real bottle, so they are drawn a touch taller than life.
           The neck sits above the fill line, so it is empty PET: on the dark
           ground of the hero that would read as a hole. `-neck` lifts it to
           the value of lit glass first, and the threads sit on top of that. */}
      <g clipPath={`url(#${uid}-body)`}>
        <rect
          x={100 - NECK_R}
          y={CAP_BOTTOM - 2}
          width={NECK_R * 2}
          height={NECK_RING_BOTTOM - CAP_BOTTOM + 4}
          fill={`url(#${uid}-neck)`}
        />
        {THREAD_YS.map((y, i) => (
          <g key={i}>
            <rect
              x={100 - NECK_R + 1}
              y={y}
              width={(NECK_R - 1) * 2}
              height="5.4"
              rx="2.7"
              fill={`url(#${uid}-thread)`}
            />
            {/* the trough under each turn, which is what makes it read as a
                ridge rather than a painted stripe */}
            <path
              d={`M${100 - NECK_R + 3} ${y + 6.1} H${100 + NECK_R - 3}`}
              stroke="#000000"
              strokeOpacity="0.3"
              strokeWidth="1.1"
              fill="none"
            />
          </g>
        ))}
        <rect
          x={100 - NECK_RING_R}
          y={NECK_RING_TOP}
          width={NECK_RING_R * 2}
          height={NECK_RING_BOTTOM - NECK_RING_TOP}
          rx="2.5"
          fill={`url(#${uid}-thread)`}
        />
        <rect
          x={100 - NECK_RING_R}
          y={NECK_RING_TOP}
          width={NECK_RING_R * 2}
          height="1.4"
          rx="0.7"
          fill="#ffffff"
          opacity="0.5"
        />
      </g>

      {/* ---- ribbed screw cap ----
           Tall, wide and translucent natural white. Fine vertical knurling over
           the top two-thirds; the smooth band under it is the tamper skirt. */}
      <g>
        <rect
          x={100 - CAP_R}
          y={CAP_TOP}
          width={CAP_R * 2}
          height={CAP_BOTTOM - CAP_TOP}
          rx="6"
          fill={`url(#${uid}-cap)`}
        />
        {Array.from({ length: RIB_COUNT }, (_, i) => {
          const x = 100 - CAP_R + 4 + (i * (CAP_R * 2 - 8)) / (RIB_COUNT - 1);
          return (
            <g key={i}>
              <rect x={x} y={RIB_TOP} width="1.2" height={RIB_BOTTOM - RIB_TOP} fill="#000" opacity="0.1" />
              <rect x={x + 1.2} y={RIB_TOP} width="0.8" height={RIB_BOTTOM - RIB_TOP} fill="#fff" opacity="0.3" />
            </g>
          );
        })}
        {/* moulded top face, then the bead that divides skirt from tamper band */}
        <rect x={100 - CAP_R} y={CAP_TOP} width={CAP_R * 2} height="5" rx="2.5" fill="#fff" opacity="0.5" />
        <rect x={100 - CAP_R + 2} y={RIB_BOTTOM + 1} width={CAP_R * 2 - 4} height="1.6" rx="0.8" fill="#000" opacity="0.13" />
        {/* flange at the foot of the cap */}
        <rect x={100 - CAP_R - 1.5} y={CAP_BOTTOM - 6} width={CAP_R * 2 + 3} height="6" rx="2" fill={`url(#${uid}-cap)`} />
        <rect x={100 - CAP_R - 1.5} y={CAP_BOTTOM - 1.8} width={CAP_R * 2 + 3} height="1.8" fill="#000" opacity="0.1" />
        <rect
          x={100 - CAP_R}
          y={CAP_TOP}
          width={CAP_R * 2}
          height={CAP_BOTTOM - CAP_TOP}
          rx="6"
          fill="none"
          stroke="#d4a63c"
          strokeOpacity="0.28"
          strokeWidth="0.8"
        />
      </g>

      {/* ---- label ---- */}
      {showLabel ? (
        <Label
          uid={uid}
          arcs={showArcs}
          arcClassName={arcClassName}
          detail={labelDetail}
        />
      ) : null}

      {/* ---- JC. ----
           Printed white on the glass below the label. Drawn after the label so
           it is never covered by the sweep's clip group. */}
      {showFine ? (
        <text
          x={LABEL_CX}
          y={JC_BASELINE}
          textAnchor="middle"
          fill="#ffffff"
          fillOpacity="0.93"
          fontSize="33"
          fontWeight="700"
          letterSpacing="0.5"
          fontFamily="var(--font-jost), system-ui, sans-serif"
        >
          JC.
        </text>
      ) : null}
    </svg>
  );
}

export default BottleArt;
