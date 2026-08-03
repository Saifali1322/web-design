/**
 * Turns the product photography into the assets the 3D viewer needs.
 *
 *   node src/components/bottle3d/tools/extract.mjs
 *
 * Reads `public/products/{id}.png`, writes
 *   public/bottle3d/label-{id}.png   — the real sticker, unwrapped off the
 *                                      bottle's cylinder and ready to wrap
 *                                      back onto the lathe's label patch
 *   public/bottle3d/fruit-{id}-N.png — cut fruit, matted off the plinth
 *   src/components/bottle3d/photoAssets.ts — the manifest, including the
 *                                      juice colours sampled from each shot
 *
 * Run by hand when the photography changes; the output is committed. This is
 * not wired into `next build` on purpose — it is a slow, deterministic,
 * once-per-shoot job, and a build step that silently rewrites source files is
 * a bad trade for the ten seconds it saves.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodePNG, encodePNG } from "./png.mjs";
import { makeSampler, findLabel, sampleJuice, hex } from "./photo.mjs";
import { FRUIT_CUTS, cutFruit } from "./fruit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const SRC = path.join(ROOT, "public/products");
const OUT = path.join(ROOT, "public/bottle3d");

/** Catalogue ids that have a hero shot, in menu order. */
const IDS = [
  "classic-orange",
  "apple",
  "pineapple",
  "orange-carrot",
  "watermelon",
  "pomegranate",
  "mango",
];

/* ------------------------------------------------------------------ *
 * Where the sticker is
 * ------------------------------------------------------------------ */

/**
 * The label's placement in the 1024² frame, measured once and asserted after.
 *
 * All seven shots are one composition — same camera, same bottle, same label —
 * and the automatic circle fit in `photo.mjs` lands on the same centre and the
 * same radius in every one of them. What the fit cannot do reliably is find
 * the *edges*: the sticker's rim is contaminated by the juice glowing through
 * the glass behind it, and its left and right edges are compressed nearly 2:1
 * by the bottle's curvature, so an edge-walker finds the shadow rather than
 * the sticker. These four numbers were read off the pixels by hand instead:
 *
 *   cy 511, radius 143   the juice→black transition down the bottle's axis
 *                        runs y=368 to y=654; the gold rim ring sits at
 *                        y=377.5 and y=643.5, i.e. 0.93 of the radius, which
 *                        is exactly where the artwork puts it. Two independent
 *                        features agreeing is what makes 143 trustworthy.
 *   cx 512               the rim ring crosses the sticker's centre row at
 *                        x=395.5 and x=629.5.
 *   cylinder 153         the only radius that makes those two rim crossings
 *                        the *same* feature: a rim at arc-radius 133 wrapped
 *                        on R reaches R·sin(133/R) either side of the axis,
 *                        and R·sin(133/R)=117 solves to R≈153. It also puts
 *                        the sticker's own edge at x=389 and x=635, which is
 *                        where the pixels put it.
 *
 * `assertPlacement` re-runs the automatic fit and fails the extraction if a
 * re-shoot has moved anything, so this stays a measurement rather than a
 * guess that quietly rots.
 */
const LABEL = { cx: 512, cy: 511, radius: 143, cylinder: 153 };

/** Half-arc and radius of the label patch in `bottleProfile.ts`, in SVG units. */
const LABEL_HALF_ARC = 82;
const LABEL_R_SVG = 76;

function assertPlacement(id, s) {
  const found = findLabel(s);
  const dx = Math.abs(found.fit.cx - LABEL.cx);
  const dy = Math.abs(found.fit.cy - LABEL.cy);
  /* The fit's radius reads short — its outer scoring ring is dragged in by the
     juice bleed around the sticker — so it is checked as a ratio, not a value.
     What matters is that it has not MOVED. */
  const ratio = found.fit.r / LABEL.radius;
  if (dx > 8 || dy > 16 || ratio < 0.83 || ratio > 0.95) {
    throw new Error(
      `${id}: the label is no longer where LABEL says it is ` +
        `(fit centre ${found.fit.cx},${found.fit.cy} r ${found.fit.r} vs ${LABEL.cx},${LABEL.cy} r ${LABEL.radius}). ` +
        `Re-measure LABEL in tools/extract.mjs against the new photography.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Label
 * ------------------------------------------------------------------ */

/**
 * Unwraps the sticker off the bottle and into the label patch's own space.
 *
 * This is the whole point of the exercise. The photo shows a circular sticker
 * lying on a cylinder, so its left and right thirds are squeezed by up to 2:1
 * and the arc type round its rim is nearly illegible there. The lathe patch it
 * has to land on is parameterised by ARC LENGTH, not by screen x. Sampling the
 * photo on a straight grid would wrap a squashed label onto a curved surface
 * and squash it a second time; going through `x = cx + R·sin(s/R)` undoes the
 * camera's projection exactly, and the curvature of the patch then puts it
 * back. It is the difference between a label that reads and a label that
 * smears the moment the bottle turns.
 *
 * Output is in the patch's coordinates: u across 2·LABEL_HALF_ARC of arc,
 * v across 2·LABEL_R_SVG of height. The sticker is smaller than the patch it
 * rides on (76 of 82), so it lands with a transparent margin either side —
 * which is correct, and is why the material is alpha-blended.
 */
function unwrapLabel(s, size) {
  const out = new Uint8ClampedArray(size * size * 4);
  const pxPerSvg = LABEL.radius / LABEL_R_SVG;
  const px = [0, 0, 0, 0];

  for (let j = 0; j < size; j++) {
    /* Canvas top is the top of the bottle: CanvasTexture uploads flipped, and
       the patch's v runs upward, so the two cancel and this is a direct map. */
    const dySvg = ((j + 0.5) / size - 0.5) * (2 * LABEL_R_SVG);
    const dyPx = dySvg * pxPerSvg;

    for (let i = 0; i < size; i++) {
      const arcSvg = ((i + 0.5) / size - 0.5) * (2 * LABEL_HALF_ARC);
      const arcPx = arcSvg * pxPerSvg;

      const o = (j * size + i) * 4;
      const dist = Math.hypot(arcPx, dyPx);
      /* Cut 2px inside the measured edge and feathered over 2px more. The
         sticker's rim in the photo has a hairline of juice glowing round it
         from the glass behind; carried onto the model that reads as a bright
         fringe floating off the bottle, so the mask eats it. */
      const alpha = Math.max(0, Math.min(1, (LABEL.radius - 2 - dist) / 2 + 0.5));
      if (alpha <= 0) continue;

      const theta = arcPx / LABEL.cylinder;
      const x = LABEL.cx + LABEL.cylinder * Math.sin(theta);
      const y = LABEL.cy + dyPx;
      s.bilinear(x, y, px);

      out[o] = px[0];
      out[o + 1] = px[1];
      out[o + 2] = px[2];
      out[o + 3] = Math.round(alpha * 255);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

/**
 * 384 rather than 1024.
 *
 * The sticker is only 286px tall in the source frame, so anything past ~400
 * is inventing detail it does not have and paying for it in bytes on a route
 * that already lazy-loads a renderer. Deliberately NOT de-shaded on the way
 * out: the obvious move is to divide out the cylinder's falloff so the model
 * does not light it twice, but the per-column statistics that would drive that
 * are dominated by the disc's own chord length and by where the gold type
 * happens to sit, not by the lighting — measuring it gives a U-shaped curve
 * that brightens the middle and darkens the rim, which is the opposite of the
 * correction. The sticker is near-black; lighting a near-black surface twice
 * costs far less than a wrong correction.
 */
const LABEL_SIZE = 384;

fs.mkdirSync(OUT, { recursive: true });

const manifest = [];

for (const id of IDS) {
  const file = path.join(SRC, `${id}.png`);
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
  const img = decodePNG(fs.readFileSync(file));
  const s = makeSampler(img);

  assertPlacement(id, s);

  const label = unwrapLabel(s, LABEL_SIZE);
  fs.writeFileSync(path.join(OUT, `label-${id}.png`), encodePNG(LABEL_SIZE, LABEL_SIZE, label));

  const juice = sampleJuice(s, LABEL);

  const fruit = [];
  for (const [n, cut] of (FRUIT_CUTS[id] ?? []).entries()) {
    const sprite = cutFruit(s, cut);
    const name = `fruit-${id}-${n + 1}.png`;
    fs.writeFileSync(path.join(OUT, name), encodePNG(sprite.size, sprite.size, sprite.data));
    fruit.push({ src: `/bottle3d/${name}`, ...cut.place });
  }

  manifest.push({
    id,
    accent: hex(juice.accent),
    accentDeep: hex(juice.accentDeep),
    label: `/bottle3d/label-${id}.png`,
    fruit,
  });

  console.log(
    `${id.padEnd(16)} accent ${hex(juice.accent)}  deep ${hex(juice.accentDeep)}  fruit ${fruit.length}`,
  );
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const ts = `/**
 * GENERATED by \`node src/components/bottle3d/tools/extract.mjs\` — do not edit.
 *
 * Everything here was read out of the product photography in
 * \`public/products/\`: the juice colours are median samples off each bottle,
 * and the asset paths point at crops taken from the same frames. Regenerate
 * rather than tweak — a hand-edited value here stops matching the photo it
 * claims to come from, which is the entire point of the file.
 */

export interface PhotoFruit {
  src: string;
  /** Resting position in world units: x across, y up, z towards the camera. */
  x: number;
  y: number;
  z: number;
  /** World-unit width of the sprite. */
  size: number;
  /** Resting roll, radians. */
  roll: number;
  /** Multiplies the drift and spin rates, so no two pieces keep time. */
  rate: number;
}

export interface PhotoAssets {
  /** Median of the lit body above the sticker. */
  accent: string;
  /** Median of the deep liquid either side of the sticker. */
  accentDeep: string;
  /** The real sticker, unwrapped off the bottle's cylinder. */
  label: string;
  fruit: PhotoFruit[];
}

export const PHOTO_ASSETS: Record<string, PhotoAssets> = {
${manifest
  .map(
    (m) => `  "${m.id}": {
    accent: "${m.accent}",
    accentDeep: "${m.accentDeep}",
    label: "${m.label}",
    fruit: [
${m.fruit
  .map(
    (f) =>
      `      { src: "${f.src}", x: ${f.x}, y: ${f.y}, z: ${f.z}, size: ${f.size}, roll: ${f.roll}, rate: ${f.rate} },`,
  )
  .join("\n")}
    ],
  },`,
  )
  .join("\n")}
};
`;

fs.writeFileSync(path.join(ROOT, "src/components/bottle3d/photoAssets.ts"), ts);
console.log(`\nwrote ${manifest.length} labels + manifest to ${OUT}`);
