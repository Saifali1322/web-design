/**
 * Every map the 3D bottle needs, painted on a 2D canvas at runtime.
 *
 * No image files, no fetches, nothing from a CDN — the whole look is generated
 * from the brand's hex values and the same label artwork the SVG draws. That
 * keeps the viewer's payload to code, lets the juice colour come straight from
 * the catalogue (`accent`/`accentDeep`) with no per-flavour asset, and means
 * there is nothing to 404 on a slow connection.
 *
 * Canvas beats a shader for the gradients here: the stops are the same numbers
 * the SVG uses, so the two bottles match by construction rather than by
 * somebody re-tuning a fragment shader until it looked close.
 *
 * Every texture returned is owned by the caller and must be `.dispose()`d.
 */

import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

import { JC_PATCH_H, JC_PATCH_W, LABEL_CY, LABEL_R } from "./bottleProfile";
import { hashRandom } from "@/lib/hash";

const GOLD = "#d4a63c";
const GOLD_PALE = "#f7e6ae";
const GOLD_DEEP = "#8a6015";

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return [c, ctx];
}

/* ------------------------------------------------------------------ *
 * Juice
 * ------------------------------------------------------------------ */

/**
 * Vertical juice gradient, matching BottleArt's `-juice` stops: the product's
 * `accent` almost the whole way down, falling to `accentDeep` only over the
 * last fifth, plus the pale pulp head floating on the surface.
 *
 * The lathe's V runs 0 at the base to 1 at the surface and textures are
 * flipped on upload, so canvas-top is the surface — which is also the order
 * you would naturally write the stops in.
 *
 * `foamV` is the head's underside in the lathe's own V, which is a function of
 * profile-point index rather than height, so the caller has to measure it and
 * hand it in. Guessing at a fraction of the canvas would put the separation
 * line wherever the shoulder happened to be sampled most densely.
 */
export function makeJuiceTexture(
  accent: string,
  accentDeep: string,
  foamV: number,
): Texture {
  const H = 512;
  const [c, ctx] = canvas(8, H);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, accent);
  g.addColorStop(0.78, accent);
  g.addColorStop(1, accentDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, H);

  /* Sediment settling at the base — the SVG's `accentDeep @ 0.28` slab. */
  const settle = ctx.createLinearGradient(0, H - 60, 0, H);
  settle.addColorStop(0, `${accentDeep}00`);
  settle.addColorStop(1, `${accentDeep}70`);
  ctx.fillStyle = settle;
  ctx.fillRect(0, H - 60, 8, 60);

  /* Pulp head: white over the juice rather than a third catalogue colour, the
     same trick BottleArt's `-foam` gradient plays, so it works for every
     flavour. */
  const foamPx = Math.round((1 - foamV) * H);
  const foam = ctx.createLinearGradient(0, 0, 0, foamPx);
  foam.addColorStop(0, "rgba(255,255,255,0.32)");
  foam.addColorStop(0.55, "rgba(255,255,255,0.24)");
  foam.addColorStop(0.86, "rgba(255,255,255,0.18)");
  foam.addColorStop(1, "rgba(255,255,255,0.06)");
  ctx.fillStyle = foam;
  ctx.fillRect(0, 0, 8, foamPx);

  /* The line the juice settles out along: pale above, deep below. */
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(0, foamPx - 3, 8, 3);
  ctx.fillStyle = accentDeep;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(0, foamPx, 8, 4);
  ctx.globalAlpha = 1;

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  return tex;
}

/**
 * The juice surface seen from above. This is the top of the pulp head, not the
 * juice itself, so it is a good deal paler than `accent` — the whole point of
 * the head is that fresh juice separates.
 */
export function makeSurfaceTexture(accent: string, accentDeep: string): Texture {
  const [c, ctx] = canvas(256, 256);

  const g = ctx.createRadialGradient(118, 108, 8, 128, 128, 128);
  g.addColorStop(0, accent);
  g.addColorStop(0.62, accentDeep);
  g.addColorStop(0.9, accent);
  g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.fillRect(0, 0, 256, 256);

  /* Foam ring, straight off BottleArt's meniscus ellipses. */
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ *
 * Label
 * ------------------------------------------------------------------ */

/** Resolves a next/font CSS variable to a family list usable by canvas. */
function fontStack(cssVar: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/**
 * Draws `text` centred on `x` with real letter-spacing.
 *
 * `ctx.letterSpacing` exists but is still missing on enough shipping browsers
 * that the wordmark would silently lose its tracking — and tracking is most of
 * what makes this wordmark look like the packaging. Advancing per glyph works
 * everywhere and centres exactly.
 */
function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
): void {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total =
    widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cursor = x - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cursor, y);
    cursor += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

/**
 * Type set on a circle. `flip` rotates each glyph 180° so text running round
 * the bottom of the label still reads upright, which is what BottleArt's
 * reversed arc path achieves in SVG.
 */
function arcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  centreAngle: number,
  spacing: number,
  flip: boolean,
): void {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0);
  const dir = flip ? -1 : 1;
  const prevAlign = ctx.textAlign;
  const prevBaseline = ctx.textBaseline;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let angle = centreAngle - (dir * total) / radius / 2;
  chars.forEach((ch, i) => {
    const step = widths[i] / radius;
    const a = angle + (dir * step) / 2;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += dir * step;
  });

  ctx.textAlign = prevAlign;
  ctx.textBaseline = prevBaseline;
}

/** The gold line-art bottle from the packaging, as Path2D fragments. */
const MARK_PATHS = {
  capRect: "M22 3h20a2.5 2.5 0 0 1 2.5 2.5v4A2.5 2.5 0 0 1 42 12H22a2.5 2.5 0 0 1-2.5-2.5v-4A2.5 2.5 0 0 1 22 3Z",
  neck: "M26 12h12v6H26z",
  body:
    "M26 18c0 3.5-11 7.5-11 14v45a6 6 0 0 0 6 6h22a6 6 0 0 0 6-6V32c0-6.5-11-10.5-11-14",
  juiceLine:
    "M16.5 41c4.5 0 6.5-2.6 11-2.6s6.5 2.6 11 2.6 6.5-2.6 9-2.6",
  droplet: "M32 52c0 0-7 7.2-7 11.6a7 7 0 0 0 14 0C39 59.2 32 52 32 52Z",
} as const;

/**
 * The circular label at ~1024px, drawn in the SVG's own coordinate space.
 *
 * `ctx.setTransform` maps the label's 132×132 SVG box onto the full canvas, so
 * every number below is the same number BottleArt uses. The canvas is square
 * but the patch it lands on is 156 arc-units wide (see LABEL_HALF_ARC), which
 * is exactly the pre-stretch the cylinder's curvature undoes.
 *
 * Fonts: the caller awaits `document.fonts.ready`. Canvas does no font
 * swapping, so drawing before the webfont lands would bake Georgia into the
 * texture permanently.
 */
export function makeLabelTexture(size = 1024): Texture {
  const [c, ctx] = canvas(size, size);
  const display = fontStack("--font-playfair", "Georgia, serif");

  const box = LABEL_R * 2;
  const s = size / box;
  ctx.setTransform(s, 0, 0, s, -(100 - LABEL_R) * s, -(LABEL_CY - LABEL_R) * s);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const cx = 100;
  const cy = LABEL_CY;

  /* Black disc — BottleArt's `-lab` gradient, 168° across the face. */
  const disc = ctx.createLinearGradient(
    cx - LABEL_R,
    cy - LABEL_R,
    cx - LABEL_R + box * 0.6,
    cy + LABEL_R,
  );
  disc.addColorStop(0, "#141210");
  disc.addColorStop(0.55, "#0a0908");
  disc.addColorStop(1, "#000000");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, LABEL_R, 0, Math.PI * 2);
  ctx.fill();

  /* One thin gold ring, set in from the edge. The real sticker has no second
     hairline — that was invented. */
  const ring = ctx.createLinearGradient(
    cx - LABEL_R,
    cy - LABEL_R,
    cx - LABEL_R + box * 0.8,
    cy + LABEL_R,
  );
  ring.addColorStop(0, GOLD_PALE);
  ring.addColorStop(0.35, GOLD);
  ring.addColorStop(0.6, GOLD_DEEP);
  ring.addColorStop(1, "#f0d68a");
  ctx.strokeStyle = ring;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, LABEL_R - 5.5, 0, Math.PI * 2);
  ctx.stroke();

  /* Arc type. Canvas angles run clockwise with y down, so -90° is the top.
     Serif on both arcs — all the type on the real sticker is one family. */
  /* `arcText` centres each glyph on the radius; the SVG puts its *baseline*
     there. Half a cap-height in, so the two rings of type land together. */
  ctx.fillStyle = GOLD;
  ctx.font = `400 7.4px ${display}`;
  arcText(ctx, "FRESHLY MADE", cx, cy, 56.5, -Math.PI / 2, 1.8, false);

  ctx.globalAlpha = 0.92;
  ctx.font = `400 6.6px ${display}`;
  arcText(
    ctx,
    "Apart of EK Entrepreneurship",
    cx,
    cy,
    63.5,
    Math.PI / 2,
    0.4,
    true,
  );
  ctx.globalAlpha = 1;

  /* Line-art bottle mark, sitting above the wordmark. */
  ctx.save();
  ctx.translate(cx, cy - 28);
  ctx.scale(0.44, 0.44);
  ctx.translate(-32, -43);
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = GOLD;
  ctx.lineJoin = "round";
  ctx.lineCap = "butt";
  ctx.fill(new Path2D(MARK_PATHS.capRect));
  ctx.globalAlpha = 0.9;
  ctx.fill(new Path2D(MARK_PATHS.neck));
  ctx.globalAlpha = 1;
  ctx.lineWidth = 4.5;
  ctx.stroke(new Path2D(MARK_PATHS.body));
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D(MARK_PATHS.juiceLine));
  ctx.lineCap = "butt";
  ctx.fill(new Path2D(MARK_PATHS.droplet));
  ctx.restore();

  /* Wordmark, in the foil gradient. */
  const foil = ctx.createLinearGradient(
    cx - 40,
    cy - 12,
    cx - 40 + 80 * 0.4,
    cy + 30,
  );
  foil.addColorStop(0, GOLD_PALE);
  foil.addColorStop(0.4, GOLD);
  foil.addColorStop(0.72, "#a97c1e");
  foil.addColorStop(1, "#f0d68a");
  ctx.fillStyle = foil;

  ctx.font = `500 19px ${display}`;
  tracked(ctx, "JUICE", cx, cy + 12, 3.2);
  ctx.font = `500 19px ${display}`;
  tracked(ctx, "CARTEL", cx, cy + 30, 0.7);

  ctx.fillStyle = GOLD_PALE;
  ctx.font = `400 9px ${display}`;
  tracked(ctx, "330ml", cx, cy + 50, 0.8);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  return tex;
}

/**
 * `JC.` as it is printed on the glass: white, opaque, transparent everywhere
 * else. Rides its own curved patch below the label for the same reason the
 * label does — a flat texture beats projecting type onto a lathe.
 */
export function makeJCTexture(size = 256): Texture {
  const [c, ctx] = canvas(size, Math.round(size * (JC_PATCH_H / JC_PATCH_W)));
  const sans = fontStack("--font-jost", "system-ui, sans-serif");
  const s = size / JC_PATCH_W;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.fillStyle = "rgba(255,255,255,0.93)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 33px ${sans}`;
  tracked(ctx, "JC.", JC_PATCH_W / 2, 36, 0.5);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  return tex;
}

/* ------------------------------------------------------------------ *
 * Condensation
 * ------------------------------------------------------------------ */

/* The condensation hash now lives in `@/lib/hash`, imported at the top of this
 * file — it used to be a second copy of the hero's, which is exactly how the
 * two came to differ. */

export interface Droplet {
  /** 0..1 around the bottle. */
  u: number;
  /** 0..1 up the profile. */
  v: number;
  /** Radius as a fraction of texture width. */
  r: number;
}

/**
 * Where the beads sit. Kept off the label, exactly as BottleArt does — a
 * droplet's specular pop lands on top of 8px type and eats it.
 *
 * `labelV` is the label's extent along the lathe's V, which is a function of
 * profile-point index rather than height, so the caller has to measure it.
 */
export function dropletLayout(
  seed: number,
  count: number,
  labelV: readonly [number, number],
  labelHalfU: number,
): Droplet[] {
  const out: Droplet[] = [];
  const [v0, v1] = labelV;
  const vMid = (v0 + v1) / 2;
  const vHalf = Math.max(1e-3, (v1 - v0) / 2);

  for (let i = 0; i < count * 5 && out.length < count; i++) {
    const u = hashRandom(seed * 5.1 + i * 1.7);
    const v = 0.1 + hashRandom(seed * 2.3 + i * 4.9 + 13) * 0.78;

    /* Wrap-aware distance to the label centre at u = 0. */
    const du = Math.min(u, 1 - u) / (labelHalfU * 1.12);
    const dv = (v - vMid) / (vHalf * 1.12);
    if (du * du + dv * dv < 1) continue;

    out.push({
      u,
      v,
      r: 0.006 + hashRandom(seed * 8.8 + i * 2.6 + 57) * 0.016,
    });
  }
  return out;
}

/**
 * Normal map of water beads on the glass.
 *
 * Built as raw ImageData rather than with gradients because a bead's normal
 * points radially outward — a radial gradient can fade a colour but it cannot
 * turn one. Only each droplet's bounding box is touched, so ~40 beads cost a
 * few thousand pixel writes, not a full 512×1024 sweep.
 */
export function makeCondensationNormal(
  drops: readonly Droplet[],
  w = 512,
  h = 1024,
): Texture {
  const [c, ctx] = canvas(w, h);
  const img = ctx.createImageData(w, h);
  const data = img.data;

  /* Flat glass everywhere: +Z in tangent space. */
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128;
    data[i + 1] = 128;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }

  for (const d of drops) {
    const cxp = d.u * w;
    /* Texture V is flipped on upload, so paint from the top down. */
    const cyp = (1 - d.v) * h;
    const rx = d.r * w;
    const ry = rx * 1.35; // beads elongate as they run

    const x0 = Math.floor(cxp - rx) - 1;
    const x1 = Math.ceil(cxp + rx) + 1;
    const y0 = Math.max(0, Math.floor(cyp - ry) - 1);
    const y1 = Math.min(h - 1, Math.ceil(cyp + ry) + 1);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx0 = (x - cxp) / rx;
        const ny0 = (y - cyp) / ry;
        const d2 = nx0 * nx0 + ny0 * ny0;
        if (d2 >= 1) continue;

        /* Soften the last 14% so the contact line antialiases. */
        const edge = d2 > 0.86 ? (1 - d2) / 0.14 : 1;
        const nz = Math.sqrt(1 - d2);
        const k = 0.7 * edge; // flatter than a true hemisphere
        let vx = nx0 * k;
        let vy = ny0 * k;
        let vz = nz * 0.55 + 0.45;
        const len = Math.hypot(vx, vy, vz) || 1;
        vx /= len;
        vy /= len;
        vz /= len;

        /* Wrap horizontally — the map goes all the way round the bottle. */
        const px = ((x % w) + w) % w;
        const o = (y * w + px) * 4;
        data[o] = Math.round((vx * 0.5 + 0.5) * 255);
        data[o + 1] = Math.round((-vy * 0.5 + 0.5) * 255);
        data[o + 2] = Math.round((vz * 0.5 + 0.5) * 255);
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  return tex;
}

/**
 * Roughness for the same beads: near-mirror glass, a slightly hazier film
 * between the drops, and the drops themselves glassier still. Blurring is done
 * with soft radial gradients, which is all a roughness map needs.
 */
export function makeCondensationRoughness(
  drops: readonly Droplet[],
  seed: number,
  w = 256,
  h = 512,
): Texture {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = "#0f0f0f"; // roughness ≈ 0.06
  ctx.fillRect(0, 0, w, h);

  /* Patchy misting, so the glass is not uniformly polished. */
  for (let i = 0; i < 14; i++) {
    const x = hashRandom(seed * 3.3 + i * 7.7) * w;
    const y = hashRandom(seed * 9.1 + i * 2.4 + 31) * h;
    const r = (0.12 + hashRandom(seed + i * 5.5) * 0.2) * w;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(90,90,90,0.55)");
    g.addColorStop(1, "rgba(90,90,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  for (const d of drops) {
    const x = d.u * w;
    const y = (1 - d.v) * h;
    const r = d.r * w * 1.3;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(0,0,0,0.9)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  return tex;
}
