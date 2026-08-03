/**
 * Shared measuring/sampling helpers for the product photography.
 *
 * The seven shots in `public/products/` are one composition: same camera, same
 * lens, same lighting, same bottle, same label — only the juice colour and the
 * fruit change. Everything here leans on that. Rather than hard-coding a crop
 * box per flavour (which would drift the moment a photo is re-shot), each
 * measurement is *found* in the pixels, and the consistency across the set is
 * then used as the sanity check that the finder worked.
 *
 * Build-time only.
 */

/* ------------------------------------------------------------------ *
 * Pixel access
 * ------------------------------------------------------------------ */

export function makeSampler(img) {
  const { width: w, height: h, data } = img;
  return {
    w,
    h,
    rgb(x, y) {
      const o = (y * w + x) * 4;
      return [data[o], data[o + 1], data[o + 2]];
    },
    lum(x, y) {
      const o = (y * w + x) * 4;
      return 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
    },
    chroma(x, y) {
      const o = (y * w + x) * 4;
      const r = data[o], g = data[o + 1], b = data[o + 2];
      return Math.max(r, g, b) - Math.min(r, g, b);
    },
    /** Bilinear RGBA. Out-of-bounds reads come back fully transparent. */
    bilinear(x, y, out) {
      if (x < 0 || y < 0 || x > w - 1 || y > h - 1) {
        out[0] = out[1] = out[2] = out[3] = 0;
        return out;
      }
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
      const fx = x - x0, fy = y - y0;
      for (let c = 0; c < 4; c++) {
        const a = data[(y0 * w + x0) * 4 + c] * (1 - fx) + data[(y0 * w + x1) * 4 + c] * fx;
        const b = data[(y1 * w + x0) * 4 + c] * (1 - fx) + data[(y1 * w + x1) * 4 + c] * fx;
        out[c] = a * (1 - fy) + b * fy;
      }
      return out;
    },
  };
}

/* ------------------------------------------------------------------ *
 * Finding the label
 * ------------------------------------------------------------------ */

/**
 * Locates the black sticker and the cylinder it is wrapped on.
 *
 * The sticker is the only large, deeply dark, *near-neutral* area in the frame
 * — every juice in the range is strongly chromatic even where it is dark, so
 * chroma separates label from liquid where luminance alone cannot (the
 * pomegranate and watermelon bottles are darker than the sticker's gold type).
 *
 * Returned radius is the sticker's TRUE radius, read off its vertical extent:
 * a circular label on an upright cylinder is foreshortened horizontally and
 * not at all vertically. The cylinder's own pixel radius then falls out of the
 * horizontal extent, because a sticker of arc-radius `r` wrapped on a cylinder
 * of radius `R` reaches `R·sin(r/R)` either side of the axis when viewed
 * head-on. Solving that for `R` is far steadier than hunting for the glass
 * silhouette, which on these shots dissolves into a warm bokeh background with
 * no edge to find.
 */
export function findLabel(s) {
  const labelish = (x, y) =>
    s.lum(Math.round(x), Math.round(y)) < 95 && s.chroma(Math.round(x), Math.round(y)) < 38 ? 1 : 0;

  /* Coarse circle fit: maximise (labelish inside) − (labelish just outside).
     Deliberately scored on rings rather than a filled disc, so the gold type
     in the middle carries no weight either way. */
  let best = null;
  for (let cx = 500; cx <= 528; cx += 1) {
    for (let cy = 496; cy <= 530; cy += 1) {
      for (let r = 120; r <= 160; r += 1) {
        let inS = 0, outS = 0, n = 0;
        for (let i = 0; i < 360; i++) {
          const a = (i / 360) * Math.PI * 2;
          const ca = Math.cos(a), sa = Math.sin(a);
          inS += labelish(cx + ca * r * 0.6, cy + sa * r * 0.6);
          inS += labelish(cx + ca * r * 0.86, cy + sa * r * 0.86);
          outS += labelish(cx + ca * r * 1.14, cy + sa * r * 1.14);
          outS += labelish(cx + ca * r * 1.3, cy + sa * r * 1.3);
          n++;
        }
        const score = inS / (2 * n) - outS / (2 * n);
        if (!best || score > best.score) best = { cx, cy, r, score };
      }
    }
  }

  /* Refine the extents by walking out along the two axes, away from the gold
     type in the middle. Three consecutive bright samples end the walk so a
     speck of foil cannot stop it early. */
  const bright = (x, y) => s.lum(Math.round(x), Math.round(y)) > 62;
  const walkY = (dir) => {
    let y = best.cy;
    const x = best.cx - Math.round(best.r * 0.62); // off the wordmark and the mark
    for (; y > 320 && y < 780; y += dir) {
      if (bright(x, y) && bright(x, y + dir) && bright(x, y + 2 * dir)) break;
    }
    return y;
  };
  const walkX = (dir) => {
    let x = best.cx;
    const y = best.cy + Math.round(best.r * 0.62); // below the "330ml" line
    for (; x > 300 && x < 740; x += dir) {
      if (bright(x, y) && bright(x + dir, y) && bright(x + 2 * dir, y)) break;
    }
    return x;
  };

  /* The off-axis walks measure a chord, not the full diameter; convert back
     through the circle. */
  const chordScale = 1 / Math.sqrt(1 - 0.62 * 0.62);
  const halfH = ((walkY(1) - walkY(-1)) / 2) * chordScale;
  const halfW = ((walkX(1) - walkX(-1)) / 2) * chordScale;
  const cy = (walkY(1) + walkY(-1)) / 2;
  const cx = (walkX(1) + walkX(-1)) / 2;

  /* Solve halfW = R·sin(halfH/R) for R by bisection. halfW/halfH is always
     comfortably inside (0,1) for a wrapped sticker, so the root is simple. */
  let loR = halfH, hiR = halfH * 40;
  for (let i = 0; i < 60; i++) {
    const mid = (loR + hiR) / 2;
    const proj = mid * Math.sin(halfH / mid);
    if (proj < halfW) hiR = mid;
    else loR = mid;
  }

  return { cx, cy, radius: halfH, halfWidth: halfW, cylinder: (loR + hiR) / 2, fit: best };
}

/* ------------------------------------------------------------------ *
 * Sampling the juice
 * ------------------------------------------------------------------ */

/** Per-channel median of a pixel list, which throws out specular outliers. */
function medianRGB(list) {
  const out = [];
  for (let c = 0; c < 3; c++) {
    const v = list.map((p) => p[c]).sort((a, b) => a - b);
    out.push(Math.round(v[v.length >> 1]));
  }
  return out;
}

export const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0").toUpperCase()).join("");

/**
 * The two juice tones, read off the bottle itself.
 *
 * Both come from one region — the lit body above the sticker, which is the
 * broadest area of undisturbed liquid in the frame — separated by brightness
 * rather than by position. Ranking the region's pixels by luminance and taking
 * a band of ranks gives `accent` from the tone the eye actually calls "the
 * colour of this juice" and `accentDeep` from the shadowed side of the same
 * liquid, which is exactly the relationship the vertical juice gradient wants.
 *
 * Sampling `accentDeep` somewhere else on the bottle instead — the slivers
 * either side of the sticker, say — reads *brighter* than `accent` on half the
 * range, because that is where the key light rakes through the glass. Two
 * tones taken from one population cannot invert like that.
 *
 * Medians within each band, never means: the specular streak down the left of
 * every bottle and the condensation beads are outliers, and a mean chases them.
 */
export function sampleJuice(s, label) {
  const { cx, cylinder } = label;

  const body = [];
  for (let y = 200; y <= 350; y++) {
    for (let x = Math.round(cx - cylinder * 0.62); x <= Math.round(cx + cylinder * 0.62); x++) {
      body.push(s.rgb(x, y));
    }
  }
  body.sort(
    (p, q) =>
      0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2] - (0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2]),
  );

  const band = (lo, hi) =>
    medianRGB(body.slice(Math.floor(body.length * lo), Math.ceil(body.length * hi)));

  /* Just below the middle for `accent`. The top half of the distribution is
     mostly the key light's streak and the condensation, not the juice. */
  return { accent: band(0.4, 0.6), accentDeep: band(0.06, 0.18) };
}
