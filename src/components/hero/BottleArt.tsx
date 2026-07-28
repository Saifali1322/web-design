"use client";

/**
 * The Juice Cartel 330ml bottle, drawn as vector.
 *
 * Modelled on the real product: clear PET, a slight taper from shoulder to
 * base, a ribbed white screw cap, and a circular black label with a thin gold
 * ring. Everything is inline SVG with plain gradients — no SVG filters, no
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
 * One place to change the silhouette. All coordinates are in the 200×520
 * user space of the viewBox.
 */
export const VB_W = 200;
export const VB_H = 520;
/** Bottle art is 200 wide by 520 tall; scenes size by width and derive height. */
export const BOTTLE_RATIO = VB_H / VB_W;

/** Surface of the juice. The bottle is filled to about 85%. */
const LIQUID_TOP = 176;
const LIQUID_BOTTOM = 486;
const LIQUID_SPAN = LIQUID_BOTTOM - LIQUID_TOP;

const LABEL_CX = 100;
const LABEL_CY = 300;
const LABEL_R = 66;

/**
 * Outer glass silhouette — cap sits on top of this. Rounded shoulder, gentle
 * taper down to a slightly narrower base, soft corners at the foot.
 */
const BODY_PATH =
  "M134 41 L134 78 " +
  "C134 118 173 126 174 166 " +
  "L167 452 C167 476 157 492 141 492 " +
  "L59 492 C43 492 33 476 33 452 " +
  "L26 166 C27 126 66 118 66 78 " +
  "L66 41 Z";

/** Inner void, inset for glass thickness. Clips the liquid and the droplets. */
const INNER_PATH =
  "M129 45 L129 82 " +
  "C129 120 168 129 169 168 " +
  "L162 450 C162 470 153 486 139 486 " +
  "L61 486 C47 486 38 470 38 450 " +
  "L31 168 C32 129 71 120 71 82 " +
  "L71 45 Z";

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
      x: 48 + a * 104,
      r: 1.1 + b * 2.4,
      speed: 13 + c * 22,
      phase: d,
      wobble: 1.5 + a * 4,
    });
  }
  return out;
}

export const BUBBLE_RISE = LIQUID_SPAN;
export const BUBBLE_BASE_Y = LIQUID_BOTTOM - 4;
export const BUBBLE_TOP_Y = LIQUID_TOP;

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
    const x = 34 + hashRandom(seed * 5.1 + i * 1.7) * 132;
    const y = 120 + hashRandom(seed * 2.3 + i * 4.9 + 13) * 360;
    /* Keep the glass clear over the label, or the type stops being legible. */
    const dx = x - LABEL_CX;
    const dy = y - LABEL_CY;
    if (dx * dx + dy * dy < (LABEL_R + 7) * (LABEL_R + 7)) continue;
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
  const goldBright = "#f3da8b";
  const full = detail === "full";

  return (
    <g>
      {/* black disc */}
      <circle cx={LABEL_CX} cy={LABEL_CY} r={LABEL_R} fill={`url(#${uid}-lab)`} />
      {/* thin gold ring, and a hairline inside it */}
      <circle
        cx={LABEL_CX}
        cy={LABEL_CY}
        r={LABEL_R - 2.5}
        fill="none"
        stroke={`url(#${uid}-ring)`}
        strokeWidth="1.6"
      />
      <circle
        cx={LABEL_CX}
        cy={LABEL_CY}
        r={LABEL_R - 6.5}
        fill="none"
        stroke={gold}
        strokeWidth="0.5"
        opacity="0.5"
      />

      {arcs ? (
        <g className={arcClassName}>
          <defs>
            <path
              id={`${uid}-arc-top`}
              d={`M ${LABEL_CX - 50} ${LABEL_CY} A 50 50 0 0 1 ${LABEL_CX + 50} ${LABEL_CY}`}
              fill="none"
            />
            {/* Drawn right-to-left round the bottom so the type sits upright
                the way it does on the real label, and pushed out to r=58 so
                it clears the "330ml" line entirely. */}
            <path
              id={`${uid}-arc-bot`}
              d={`M ${LABEL_CX - 58} ${LABEL_CY} A 58 58 0 0 0 ${LABEL_CX + 58} ${LABEL_CY}`}
              fill="none"
            />
          </defs>
          <text
            fill={gold}
            fontSize="8"
            letterSpacing="1.9"
            fontFamily="var(--font-jost), sans-serif"
            fontWeight="500"
          >
            <textPath href={`#${uid}-arc-top`} startOffset="50%" textAnchor="middle">
              FRESHLY MADE
            </textPath>
          </text>
          <text
            fill={gold}
            fontSize="6.4"
            letterSpacing="0.85"
            fontFamily="var(--font-jost), sans-serif"
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
            ? `translate(${LABEL_CX} ${LABEL_CY - 32}) scale(0.28) translate(-32 -44)`
            : `translate(${LABEL_CX} ${LABEL_CY}) scale(0.85) translate(-32 -44)`
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

      {/* wordmark, two lines, gold serif */}
      {full ? (
        <>
      <text
        x={LABEL_CX}
        y={LABEL_CY + 4}
        textAnchor="middle"
        fill={`url(#${uid}-foil)`}
        fontSize="19"
        letterSpacing="2.2"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontWeight="500"
      >
        JUICE
      </text>
      <text
        x={LABEL_CX}
        y={LABEL_CY + 22}
        textAnchor="middle"
        fill={`url(#${uid}-foil)`}
        fontSize="17"
        letterSpacing="1.6"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontWeight="500"
      >
        CARTEL
      </text>

      <line
        x1={LABEL_CX - 15}
        x2={LABEL_CX + 15}
        y1={LABEL_CY + 29}
        y2={LABEL_CY + 29}
        stroke={goldBright}
        strokeWidth="0.6"
        opacity="0.55"
      />
      <text
        x={LABEL_CX}
        y={LABEL_CY + 38}
        textAnchor="middle"
        fill={gold}
        fontSize="7.6"
        letterSpacing="1.3"
        fontFamily="var(--font-jost), sans-serif"
      >
        330ml
      </text>
        </>
      ) : null}

      {/* travelling foil sweep, clipped to the disc */}
      <g clipPath={`url(#${uid}-labclip)`}>
        <rect
          data-sweep=""
          x={LABEL_CX - LABEL_R - 90}
          y={LABEL_CY - LABEL_R - 10}
          width="46"
          height={LABEL_R * 2 + 20}
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
  const bubbleList = bubbles > 0 ? bubbleSpecs(seed, bubbles) : [];
  const drops = dropletCount > 0 ? droplets(seed, dropletCount) : [];
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

        {/* juice: bright at the surface, deep at the base */}
        <linearGradient id={`${uid}-juice`} x1="0" y1={LIQUID_TOP} x2="0" y2={LIQUID_BOTTOM} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={accent} />
          <stop offset="0.45" stopColor={accent} />
          <stop offset="1" stopColor={accentDeep} />
        </linearGradient>

        {/* cylinder shading: dark at both edges, open in the middle */}
        <linearGradient id={`${uid}-cyl`} x1="26" y1="0" x2="174" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.16" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.4" stopColor="#000" stopOpacity="0" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>

        {/* empty glass above the juice */}
        <linearGradient id={`${uid}-glass`} x1="26" y1="0" x2="174" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7f1e4" stopOpacity="0.10" />
          <stop offset="0.35" stopColor="#f7f1e4" stopOpacity="0.03" />
          <stop offset="0.78" stopColor="#f7f1e4" stopOpacity="0.05" />
          <stop offset="1" stopColor="#f7f1e4" stopOpacity="0.13" />
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

        <linearGradient id={`${uid}-cap`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6d6a63" />
          <stop offset="0.16" stopColor="#efeae0" />
          <stop offset="0.44" stopColor="#ffffff" />
          <stop offset="0.72" stopColor="#cdc7bb" />
          <stop offset="1" stopColor="#5f5b54" />
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
          x="20"
          y={LIQUID_TOP}
          width="160"
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

        {/* meniscus + foam at the surface */}
        <ellipse
          cx="100"
          cy={LIQUID_TOP}
          rx="68"
          ry="7.5"
          fill={`url(#${uid}-meniscus)`}
        />
        <ellipse
          cx="100"
          cy={LIQUID_TOP + 1.5}
          rx="66"
          ry="6"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.5"
          strokeWidth="1.1"
        />
        <ellipse
          cx="100"
          cy={LIQUID_TOP + 4}
          rx="60"
          ry="4"
          fill="#fff"
          opacity="0.12"
        />

        {/* cylinder shading over the juice so it is not a flat slab */}
        <rect
          x="20"
          y={LIQUID_TOP - 2}
          width="160"
          height={LIQUID_SPAN + 14}
          fill={`url(#${uid}-cyl)`}
        />

        {/* dense settle at the very bottom */}
        <rect
          x="20"
          y={LIQUID_BOTTOM - 46}
          width="160"
          height="52"
          fill={accentDeep}
          opacity="0.5"
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
        <g data-spec="">
          <rect
            x="41"
            y="100"
            width="27"
            height="378"
            rx="13"
            fill={`url(#${uid}-spec)`}
            opacity="0.9"
          />
          <rect
            x="41"
            y="100"
            width="27"
            height="378"
            rx="13"
            fill={`url(#${uid}-specv)`}
            opacity="0.4"
          />
          {/* a second, tighter catch keeps the glass from looking matte */}
          <rect
            x="49"
            y="150"
            width="6"
            height="300"
            rx="3"
            fill="#ffffff"
            opacity="0.35"
          />
        </g>
        {/* Bounce starts below the shoulder: run it any higher and the
            rounded cap of the rect reads as a bright blob floating in the
            empty glass. */}
        <g data-bounce="">
          <rect
            x="139"
            y="192"
            width="22"
            height="278"
            rx="11"
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
        d="M66 41 L66 78 C66 118 27 126 26 166 L33 452"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.42"
        strokeWidth="1.3"
      />
      <path
        d="M174 166 L167 452 C167 476 157 492 141 492"
        fill="none"
        stroke="#f3da8b"
        strokeOpacity="0.5"
        strokeWidth="1.3"
      />

      {/* ---- neck support ring ---- */}
      <rect x="63" y="44" width="74" height="6" rx="3" fill="#efeae0" opacity="0.26" />
      <rect x="63" y="44" width="74" height="6" rx="3" fill="none" stroke="#f3da8b" strokeOpacity="0.3" strokeWidth="0.6" />

      {/* ---- ribbed screw cap ---- */}
      <g>
        <rect x="61" y="3" width="78" height="38" rx="4" fill={`url(#${uid}-cap)`} />
        {Array.from({ length: 15 }, (_, i) => (
          <rect
            key={i}
            x={64 + i * 5}
            y="6"
            width="1.4"
            height="32"
            fill="#000"
            opacity="0.14"
          />
        ))}
        <rect x="61" y="3" width="78" height="6" rx="3" fill="#fff" opacity="0.55" />
        <rect x="61" y="35" width="78" height="6" rx="3" fill="#000" opacity="0.16" />
        <rect
          x="61"
          y="3"
          width="78"
          height="38"
          rx="4"
          fill="none"
          stroke="#d4a63c"
          strokeOpacity="0.32"
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
    </svg>
  );
}

export default BottleArt;
