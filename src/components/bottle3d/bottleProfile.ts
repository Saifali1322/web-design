/**
 * The bottle silhouette, expressed as 2D lathe profiles.
 *
 * Every number in this file is lifted from the path data in
 * `src/components/hero/BottleArt.tsx` — the same 200×556 user space, the same
 * shoulder cubic, the same taper, the same cap band. The 3D bottle and the SVG
 * poster it cross-fades from have to read as one object, and the only way to
 * guarantee that is to derive both from one set of coordinates rather than
 * eyeball a second silhouette. Both are in turn traced from the photographs in
 * `docs/reference/bottles/`.
 *
 * Deliberately free of any `three` import so the maths can be reasoned about
 * (and unit-tested) without dragging a renderer in. The caller turns these
 * pairs into `Vector2`s.
 *
 * Coordinate conventions
 * ----------------------
 * SVG space: x right, y DOWN, bottle axis at x=100, cap top at y=14,
 *            base at y=542.
 * World space: y UP, origin at the bottle's vertical mid-point, 1 world unit
 *            = 100 SVG units, so the bottle stands ~5.3 units tall.
 */

/** Bottle axis in SVG user space. */
const AXIS_X = 100;
/** SVG y that becomes world y = 0 — halfway between cap top and base. */
const MID_Y = 278;
/** SVG user unit → world unit. */
export const UNIT = 0.01;

/** Surface of the juice, and the inside of the base. Matches BottleArt. */
export const LIQUID_TOP_Y = 96;
export const LIQUID_BOTTOM_Y = 536;
/** Underside of the pulp head floating on the juice. Matches BottleArt. */
export const FOAM_BOTTOM_Y = 184;

/** Circular label: centre and radius in SVG space. */
export const LABEL_CY = 310;
export const LABEL_R = 76;

/**
 * How far round the bottle the label physically wraps, as an arc half-length
 * in SVG units.
 *
 * A real circular label on a cylinder is *wider* than it looks: the curvature
 * foreshortens its edges when you view it head-on. 76 units of arc on a body
 * of radius 95 would project to only ~72 and the label would read as a
 * vertical ellipse. 82 units of arc projects back to ~76.5 against the label's
 * 76-unit height, which is near enough to circular that the eye reads it as
 * the SVG's disc.
 */
export const LABEL_HALF_ARC = 82;

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

/**
 * Cuts a bottom-to-top profile at an SVG y, interpolating the final point.
 *
 * The juice now fills the shoulder rather than stopping on the straight wall,
 * so the liquid's profile has to end part-way through a curve.
 */
function truncateAtY(pts: Pt[], y: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i][1] <= y) {
      const prev = pts[i - 1];
      if (prev && prev[1] !== pts[i][1]) {
        const t = (prev[1] - y) / (prev[1] - pts[i][1]);
        out.push([prev[0] + (pts[i][0] - prev[0]) * t, y]);
      } else {
        out.push([pts[i][0], y]);
      }
      return out;
    }
    out.push(pts[i]);
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
 *   base foot cubic → taper → shoulder cubic → threaded neck.
 *
 * Point order matters. `LatheGeometry` winds its triangles so that a profile
 * running in +y produces outward-facing normals; reverse it and the whole
 * bottle turns inside out.
 *
 * The neck runs past the SVG's y=64 and closes with a flat disc at y=50. That
 * cap is never seen — the screw cap covers y=14..64 — but closing the shell
 * keeps the transmissive material from having to shade an open edge.
 */
export function outerProfile(quality: number): Pt[] {
  const pts: Pt[] = [[AXIS_X, 542]];

  /* Foot: BODY_PATH's "C193.5 524 185 542 163 542", walked upwards. The cubic
     starts horizontal at (163,542), so joining it to the axis point above with
     a straight run leaves no crease at the centre of the base. */
  pts.push(...sampleLine([AXIS_X, 542], [163, 542], 2));
  pts.push(
    ...sampleCubic(
      [193.5, 496],
      [193.5, 524],
      [185, 542],
      [163, 542],
      Math.round(9 * quality),
      true,
      true,
    ),
  );

  /* Body wall, 195→193.5 over 246 units. Near straight, but subdivided: the
     glass carries a droplet normal map and a near-mirror specular, and both
     need more than two rings of vertices to interpolate smoothly. */
  pts.push(...sampleLine([193.5, 496], [195, 250], Math.round(11 * quality)));

  /* Shoulder: "C160 104 191 164 195 250", walked upwards. Long and eased —
     see BottleArt's note on why this is not a tight radius. */
  pts.push(
    ...sampleCubic(
      [157, 92],
      [160, 104],
      [191, 164],
      [195, 250],
      Math.round(16 * quality),
      true,
      true,
    ),
  );

  /* Neck, with the thread turns that show below the closure skirt, then the
     hidden closing disc. */
  pts.push(...threadedNeck());
  pts.push([AXIS_X, 50]);

  return pts;
}

/**
 * The neck from the shoulder up to the closing disc, carrying the screw
 * threads as radius bumps.
 *
 * Modelled rather than mapped: a thread is in the silhouette of a bottle seen
 * against a light background, and the whole reason the reference photographs
 * read as a real product is that you can see the turns. A normal map would
 * lose them the moment the bottle turned edge-on.
 */
function threadedNeck(): Pt[] {
  const R = 157;
  const CREST = 159;
  const out: Pt[] = [];
  /* BottleArt's THREAD_YS, bottom-most first — this walks upwards. */
  for (const y of [74, 65]) {
    out.push([R, y + 5.4 + 1.2]);
    out.push([CREST - 0.4, y + 5.2]);
    out.push([CREST, y + 3.9]);
    out.push([CREST, y + 1.9]);
    out.push([CREST - 0.6, y + 0.6]);
    out.push([R, y - 0.4]);
  }
  out.push([R, 50]);
  return out;
}

/**
 * Inside face of the glass, bottom to top — BottleArt's `INNER_PATH`, cut off
 * at the juice surface. The fill line is up in the shoulder now, so this ends
 * part-way along the shoulder cubic rather than on the straight wall.
 */
export function innerProfile(quality: number): Pt[] {
  const pts: Pt[] = [[AXIS_X, LIQUID_BOTTOM_Y]];

  pts.push(...sampleLine([AXIS_X, LIQUID_BOTTOM_Y], [161, 536], 2));
  pts.push(
    ...sampleCubic(
      [188.5, 494],
      [188.5, 518],
      [181, 536],
      [161, 536],
      Math.round(8 * quality),
      true,
      true,
    ),
  );

  pts.push(...sampleLine([188.5, 494], [190, 251], Math.round(11 * quality)));
  pts.push(
    ...sampleCubic(
      [152, 92],
      [155, 105],
      [186, 165],
      [190, 251],
      Math.round(16 * quality),
      true,
      true,
    ),
  );

  return truncateAtY(pts, LIQUID_TOP_Y);
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
 * the same place. The step at y≈58 is the flange at the foot of the skirt.
 *
 * Written as x on the right-hand silhouette (axis at 100), same as every other
 * profile here, so `toRadius` applies uniformly. BottleArt's cap is
 * `x=37 w=126`, i.e. a radius of 63, with the flange 1.5 units proud.
 */
export function capProfile(): Pt[] {
  return [
    [162.0, 66.0],
    [164.5, 64.0],
    [164.5, 59.6],
    [163.2, 58.0],
    [163.0, 45.5],
    [163.0, 19.0],
    [162.4, 16.6],
    [160.4, 14.8],
    [155.0, 14.0],
    [144.0, 13.3],
    [118.0, 13.1],
    [AXIS_X, 13.1],
  ];
}

/** SVG y range over which the cap's knurling runs. Matches BottleArt. */
export const CAP_RIB_BAND: readonly [number, number] = [19, 45];
/**
 * BottleArt draws 41 ribs across the cap's full width, which is one half of
 * the circumference, so the closure carries a shade under twice that.
 */
export const CAP_RIB_COUNT = 76;

/**
 * Neck support ring — BottleArt's `rect x=41 y=84 w=118 h=8`, given a rounded
 * outer edge. Starts and ends flush with the neck radius so the open ends of
 * the lathe are buried in the glass.
 */
export function neckRingProfile(): Pt[] {
  return [
    [157.0, 93.2],
    [159.4, 91.8],
    [160.0, 88.0],
    [159.4, 84.4],
    [157.0, 83.2],
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
export const BOTTLE_HEIGHT = (542 - 14) * UNIT;
