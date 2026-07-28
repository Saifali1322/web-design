/**
 * The bottle silhouette, expressed as 2D lathe profiles.
 *
 * Every number in this file is lifted from the path data in
 * `src/components/hero/BottleArt.tsx` — the same 200×520 user space, the same
 * shoulder cubic, the same taper, the same cap band. The 3D bottle and the SVG
 * poster it cross-fades from have to read as one object, and the only way to
 * guarantee that is to derive both from one set of coordinates rather than
 * eyeball a second silhouette.
 *
 * Deliberately free of any `three` import so the maths can be reasoned about
 * (and unit-tested) without dragging a renderer in. The caller turns these
 * pairs into `Vector2`s.
 *
 * Coordinate conventions
 * ----------------------
 * SVG space: x right, y DOWN, bottle axis at x=100, cap top at y=3,
 *            base at y=492.
 * World space: y UP, origin at the bottle's vertical mid-point, 1 world unit
 *            = 100 SVG units, so the bottle stands ~4.9 units tall.
 */

/** Bottle axis in SVG user space. */
const AXIS_X = 100;
/** SVG y that becomes world y = 0 — halfway between cap top and base. */
const MID_Y = 247.5;
/** SVG user unit → world unit. */
export const UNIT = 0.01;

/** Surface of the juice, and the inside of the base. Matches BottleArt. */
export const LIQUID_TOP_Y = 176;
export const LIQUID_BOTTOM_Y = 486;

/** Circular label: centre and radius in SVG space. */
export const LABEL_CY = 300;
export const LABEL_R = 66;

/**
 * How far round the bottle the label physically wraps, as an arc half-length
 * in SVG units.
 *
 * A real circular label on a cylinder is *wider* than it looks: the curvature
 * foreshortens its edges when you view it head-on. 66 units of arc would
 * project to only ~57 and the label would read as a vertical ellipse. 78 units
 * of arc projects back to ~63 against the label's 66-unit height, which is
 * near enough to circular that the eye reads it as the SVG's disc.
 */
export const LABEL_HALF_ARC = 78;

export type Pt = readonly [x: number, y: number];

/* ------------------------------------------------------------------ *
 * Curve sampling
 * ------------------------------------------------------------------ */

function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/**
 * Samples a cubic into `steps` segments. `t` runs 1→0 when `reverse` is set,
 * which is how the shoulder and foot curves get walked bottom-to-top — the
 * SVG draws them downwards and a lathe needs its points going the other way.
 */
function sampleCubic(
  p0: Pt,
  p1: Pt,
  p2: Pt,
  p3: Pt,
  steps: number,
  reverse: boolean,
  skipFirst: boolean,
): Pt[] {
  const out: Pt[] = [];
  for (let i = skipFirst ? 1 : 0; i <= steps; i++) {
    const t = i / steps;
    out.push(cubicAt(p0, p1, p2, p3, reverse ? 1 - t : t));
  }
  return out;
}

/** Straight run, excluding the start point (the previous segment owns it). */
function sampleLine(a: Pt, b: Pt, steps: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The silhouettes
 * ------------------------------------------------------------------ */

/**
 * Outer glass, bottom to top.
 *
 * Traces the right-hand half of BottleArt's `BODY_PATH`:
 *   base foot cubic → taper → shoulder cubic → neck.
 *
 * Point order matters. `LatheGeometry` winds its triangles so that a profile
 * running in +y produces outward-facing normals; reverse it and the whole
 * bottle turns inside out.
 *
 * The neck runs 15 units past the SVG's y=41 and closes with a flat disc at
 * y=26. That cap is never seen — the screw cap covers y=3..42 — but closing
 * the shell keeps the transmissive material from having to shade an open edge.
 */
export function outerProfile(quality: number): Pt[] {
  const pts: Pt[] = [[AXIS_X, 492]];

  /* Foot: BODY_PATH's "C167 476 157 492 141 492", walked upwards. The cubic
     starts horizontal at (141,492), so joining it to the axis point above with
     a straight run leaves no crease at the centre of the base. */
  pts.push(...sampleLine([AXIS_X, 492], [141, 492], 2));
  pts.push(
    ...sampleCubic(
      [167, 452],
      [167, 476],
      [157, 492],
      [141, 492],
      Math.round(9 * quality),
      true,
      true,
    ),
  );

  /* Long taper, 174→167 over 286 units. Straight, but subdivided: the glass
     carries a droplet normal map and a near-mirror specular, and both need
     more than two rings of vertices to interpolate smoothly. */
  pts.push(...sampleLine([167, 452], [174, 166], Math.round(10 * quality)));

  /* Shoulder: "C134 118 173 126 174 166", walked upwards. */
  pts.push(
    ...sampleCubic(
      [134, 78],
      [134, 118],
      [173, 126],
      [174, 166],
      Math.round(12 * quality),
      true,
      true,
    ),
  );

  /* Neck, then the hidden closing disc. */
  pts.push(...sampleLine([134, 78], [134, 26], 3));
  pts.push([AXIS_X, 26]);

  return pts;
}

/**
 * Inside face of the glass, bottom to top — BottleArt's `INNER_PATH`.
 * Only used as the starting shape for the liquid, which is then inset.
 */
export function innerProfile(quality: number): Pt[] {
  const pts: Pt[] = [[AXIS_X, LIQUID_BOTTOM_Y]];

  pts.push(...sampleLine([AXIS_X, LIQUID_BOTTOM_Y], [139, 486], 2));
  pts.push(
    ...sampleCubic(
      [162, 450],
      [162, 470],
      [153, 486],
      [139, 486],
      Math.round(8 * quality),
      true,
      true,
    ),
  );

  /* INNER_PATH's taper is "L162 450" from the shoulder end at (169,168).
     The juice stops at y=176, a little way down that line. */
  const topR = 169 - ((7 * (LIQUID_TOP_Y - 168)) / (450 - 168));
  pts.push(
    ...sampleLine([162, 450], [topR, LIQUID_TOP_Y], Math.round(10 * quality)),
  );

  return pts;
}

/**
 * Pushes a profile inwards by `d` along its own normal.
 *
 * Used to sit the juice a hair inside the glass instead of exactly on it.
 * Two coincident lathes would z-fight, and the fight is worse here than usual
 * because the outer surface is transmissive: the flicker gets refracted.
 */
export function insetProfile(pts: Pt[], d: number): Pt[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    /* SVG y points down and the profile runs bottom-to-top with the solid on
       the axis side, so (ty, -tx) is the inward normal. */
    const nx = ty / len;
    const ny = -tx / len;
    return [Math.max(0, p[0] + nx * d), p[1] + ny * d] as Pt;
  });
}

/* ------------------------------------------------------------------ *
 * Cap
 * ------------------------------------------------------------------ */

/**
 * Ribbed screw cap, bottom to top. Open at the bottom, like a real closure —
 * the glass neck runs up inside it, so closing it would put two surfaces in
 * the same place. The seam at y≈36 is the tamper band.
 *
 * Written as x on the right-hand silhouette (axis at 100), same as every other
 * profile here, so `toRadius` applies uniformly. BottleArt's cap rect is
 * `x=61 w=78`, i.e. a radius of 39.
 */
export function capProfile(): Pt[] {
  return [
    [138.6, 43],
    [139.2, 41.5],
    [139.2, 37.6],
    [138.3, 36.2],
    [139.0, 34.8],
    [139.0, 8.5],
    [138.4, 6.2],
    [136.2, 4.2],
    [131.0, 3.0],
    [122.0, 2.4],
    [111.0, 2.2],
    [AXIS_X, 2.2],
  ];
}

/** SVG y range over which the cap's knurling runs. */
export const CAP_RIB_BAND: readonly [number, number] = [8.5, 35.2];
export const CAP_RIB_COUNT = 40;

/**
 * Neck support ring — BottleArt's `rect x=63 y=44 w=74 h=6`, given a rounded
 * outer edge. Starts and ends flush with the neck radius so the open ends of
 * the lathe are buried in the glass.
 */
export function neckRingProfile(): Pt[] {
  return [
    [134.0, 51.0],
    [137.0, 49.8],
    [137.8, 47.0],
    [137.0, 44.2],
    [134.0, 43.0],
  ];
}

/* ------------------------------------------------------------------ *
 * SVG → world
 * ------------------------------------------------------------------ */

/** Radius in world units for an SVG x on the right-hand silhouette. */
export const toRadius = (x: number): number => (x - AXIS_X) * UNIT;
/** World height for an SVG y. */
export const toHeight = (y: number): number => (MID_Y - y) * UNIT;

/** Total world height of the bottle including the cap. */
export const BOTTLE_HEIGHT = (492 - 3) * UNIT;
