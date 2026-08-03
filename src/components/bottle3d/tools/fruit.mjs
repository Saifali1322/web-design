/**
 * Cutting the fruit out of the product photography.
 *
 * The brief allowed either photographic cutouts or freshly drawn vector fruit.
 * Cutouts win here, and only because of what the seven frames have in common:
 * every piece of fruit is lit by the same key, sits on the same black slate,
 * and is photographed with the same lens. Vector fruit would have to be re-lit
 * to match seven different juices and would still read as a different medium
 * from the photographic cards beside it. Cut fruit reads as the same shoot.
 *
 * What makes it tractable is the plinth. The fruit are bright and saturated;
 * the slate behind them is near-black; so a luminance threshold does most of
 * the work. What a threshold cannot do is tell fruit from the splash of juice
 * arcing past it, which is bright, saturated and frequently touching. That is
 * what the garbage matte is for — a hand-placed ellipse per piece, the same
 * tool a compositor would reach for, so the automatic part only ever has to
 * separate fruit from slate inside a region a human already vouched for.
 *
 * Build-time only.
 */

/* ------------------------------------------------------------------ *
 * The crops
 * ------------------------------------------------------------------ */

/**
 * Per juice: which pieces to cut, and where each one goes in the viewer.
 *
 * `place.x`/`place.y` are fractions of the visible half-frame at that piece's
 * depth, not world units — the modal is 460px wide on a desktop and the full
 * width of a phone, and a layout in world units would either collide with the
 * bottle on one or float in the void on the other. `place.z` is a real world
 * offset towards the camera, which is what produces the parallax.
 *
 * The four slots are the same across every flavour, so the composition is one
 * design rather than seven; only the crop coordinates change, because only the
 * fruit changes. Slots are kept clear of the bottle's silhouette and weighted
 * to the lower half of the frame, which is where the fruit sits in the shots.
 */
export const FRUIT_CUTS = {
  "classic-orange": [
    { x: 658, y: 858, r: 100, place: { x: -0.74, y: -0.52, z: 0.9, size: 0.86, roll: -0.18, rate: 1 } },
    { x: 150, y: 690, r: 62, place: { x: 0.78, y: -0.14, z: -0.7, size: 0.62, roll: 0.34, rate: 0.72 } },
    { x: 858, y: 546, r: 68, place: { x: -0.8, y: 0.34, z: -1.3, size: 0.5, roll: -0.5, rate: 1.31 } },
    { x: 445, y: 918, r: 76, place: { x: 0.72, y: -0.56, z: 0.4, size: 0.66, roll: 0.62, rate: 0.9 } },
  ],
  apple: [
    { x: 654, y: 866, r: 108, place: { x: -0.74, y: -0.52, z: 0.9, size: 0.86, roll: -0.18, rate: 1 } },
    { x: 156, y: 686, r: 62, place: { x: 0.78, y: -0.14, z: -0.7, size: 0.62, roll: 0.34, rate: 0.72 } },
    { x: 858, y: 556, r: 70, place: { x: -0.8, y: 0.34, z: -1.3, size: 0.5, roll: -0.5, rate: 1.31 } },
    { x: 444, y: 906, r: 80, place: { x: 0.72, y: -0.56, z: 0.4, size: 0.66, roll: 0.62, rate: 0.9 } },
  ],
  pineapple: [
    { x: 660, y: 858, r: 106, place: { x: -0.74, y: -0.52, z: 0.9, size: 0.86, roll: -0.18, rate: 1 } },
    { x: 160, y: 680, r: 72, place: { x: 0.78, y: -0.14, z: -0.7, size: 0.62, roll: 0.34, rate: 0.72 } },
    { x: 858, y: 562, r: 70, place: { x: -0.8, y: 0.34, z: -1.3, size: 0.5, roll: -0.5, rate: 1.31 } },
    { x: 448, y: 892, r: 68, place: { x: 0.72, y: -0.56, z: 0.4, size: 0.5, roll: 0.62, rate: 0.9 } },
  ],
  "orange-carrot": [
    { x: 670, y: 866, r: 92, place: { x: -0.74, y: -0.52, z: 0.9, size: 0.86, roll: -0.18, rate: 1 } },
    { x: 158, y: 700, r: 62, place: { x: 0.78, y: -0.14, z: -0.7, size: 0.62, roll: 0.34, rate: 0.72 } },
    { x: 870, y: 572, r: 58, place: { x: -0.8, y: 0.34, z: -1.3, size: 0.5, roll: -0.5, rate: 1.31 } },
    { x: 360, y: 866, r: 88, place: { x: 0.72, y: -0.56, z: 0.4, size: 0.72, roll: 0.62, rate: 0.9 } },
  ],
  watermelon: [
    { x: 676, y: 848, r: 106, place: { x: -0.74, y: -0.52, z: 0.9, size: 0.86, roll: -0.18, rate: 1 } },
    { x: 158, y: 686, r: 70, place: { x: 0.78, y: -0.14, z: -0.7, size: 0.62, roll: 0.34, rate: 0.72 } },
    { x: 862, y: 548, r: 70, place: { x: -0.8, y: 0.34, z: -1.3, size: 0.5, roll: -0.5, rate: 1.31 } },
    { x: 340, y: 862, r: 96, place: { x: 0.72, y: -0.56, z: 0.4, size: 0.66, roll: 0.62, rate: 0.9 } },
  ],
  pomegranate: [
    { x: 660, y: 862, r: 104, place: { x: -0.74, y: -0.52, z: 0.9, size: 0.86, roll: -0.18, rate: 1 } },
    { x: 156, y: 694, r: 64, place: { x: 0.78, y: -0.14, z: -0.7, size: 0.62, roll: 0.34, rate: 0.72 } },
    { x: 862, y: 548, r: 70, place: { x: -0.8, y: 0.34, z: -1.3, size: 0.5, roll: -0.5, rate: 1.31 } },
    { x: 446, y: 898, r: 76, place: { x: 0.72, y: -0.56, z: 0.4, size: 0.62, roll: 0.62, rate: 0.9 } },
  ],
  mango: [
    { x: 668, y: 862, r: 106, place: { x: -0.74, y: -0.52, z: 0.9, size: 0.86, roll: -0.18, rate: 1 } },
    { x: 156, y: 682, r: 62, place: { x: 0.78, y: -0.14, z: -0.7, size: 0.62, roll: 0.34, rate: 0.72 } },
    { x: 872, y: 566, r: 66, place: { x: -0.8, y: 0.34, z: -1.3, size: 0.5, roll: -0.5, rate: 1.31 } },
    { x: 372, y: 878, r: 100, place: { x: 0.72, y: -0.56, z: 0.4, size: 0.72, roll: 0.62, rate: 0.9 } },
  ],
};

/* ------------------------------------------------------------------ *
 * Matting
 * ------------------------------------------------------------------ */

/** Otsu's threshold over a luminance histogram. */
function otsu(hist, total) {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, bestVar = -1;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > bestVar) {
      bestVar = between;
      best = t;
    }
  }
  return best;
}

/**
 * Cuts one piece of fruit out of the frame.
 *
 * The steps, in order and each for a reason:
 *
 *  1. Garbage matte. Everything outside the hand-placed circle is gone before
 *     anything is measured, so the threshold is computed on fruit-and-slate
 *     rather than on whatever else was in the neighbourhood.
 *  2. Otsu, floored and pulled down. The histogram inside the window is
 *     strongly bimodal — lit fruit against black slate — which is the case
 *     Otsu was designed for. Taking less than it suggests keeps the fruit's
 *     own shadowed side attached instead of shaving it off.
 *  3. One connected component, grown from the middle. Splash that clears the
 *     fruit by even a pixel is dropped here; splash that touches it is not,
 *     which is why the crops were chosen where they were.
 *  4. Hole fill, so a dark seed or a shadowed crease does not punch through.
 *  5. Feather, then bleed the colour outward under the transparent pixels.
 *     Straight-alpha textures mip down towards whatever sits in the RGB of
 *     their transparent texels; leave that black and every piece grows a dark
 *     halo the moment it is minified, which is exactly how a cutout announces
 *     itself as a cutout.
 */
export function cutFruit(s, cut) {
  const size = cut.r * 2;
  const x0 = Math.round(cut.x - cut.r);
  const y0 = Math.round(cut.y - cut.r);

  const lum = new Float32Array(size * size);
  const chroma = new Float32Array(size * size);
  const inWindow = new Uint8Array(size * size);
  const hist = new Uint32Array(256);
  let inCount = 0;

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const k = j * size + i;
      const dx = (i - cut.r) / cut.r;
      const dy = (j - cut.r) / cut.r;
      if (dx * dx + dy * dy > 1) continue;
      inWindow[k] = 1;
      inCount++;
      const l = s.lum(x0 + i, y0 + j);
      lum[k] = l;
      chroma[k] = s.chroma(x0 + i, y0 + j);
      hist[Math.min(255, Math.round(l))]++;
    }
  }

  const threshold = Math.max(26, otsu(hist, inCount) * 0.72);

  /* Bright OR strongly coloured, not bright alone.
     Otsu on luminance is the right split for an orange on slate, and exactly
     the wrong one for a pomegranate: its seeds are darker than its own pith,
     so a luminance threshold cuts the fruit in half and keeps the rind. The
     slate is the one thing in the frame with no colour in it at all, so a
     chroma test rescues every dark-but-saturated pixel the luminance test
     drops, without letting any of the plinth back in. */
  const lit = new Uint8Array(size * size);
  for (let k = 0; k < lit.length; k++) {
    lit[k] =
      inWindow[k] && (lum[k] >= threshold || (chroma[k] >= 34 && lum[k] >= 16)) ? 1 : 0;
  }

  /* Open the mask before choosing a component, then grow the chosen one back
     inside the unopened mask.

     Erosion is what separates fruit from splash. The two are both bright and
     they touch, so no threshold will ever part them — but they touch across a
     few pixels of liquid film, and three pixels of erosion cuts that neck
     while barely troubling a fruit ninety pixels wide. Regrowing by
     four conditional dilations restores the piece to its own outline and lets
     the splash back in only as far as it can travel up the severed neck.

     The component is chosen by how much of the crop's MIDDLE it covers, not
     by its total area and not by whether it contains the one centre pixel.
     Area alone hands the cutout to a splash arc that happens to be bigger
     than the fruit; a centre pixel alone fails on pomegranate, where the
     middle of the crop is a shadowed seed. Overlap with the central fifth is
     the test that survives both. */
  const opened = erode(lit, size, 4);
  const seed = centralComponent(opened, size, cut.r * 0.4);
  const solid = reconstruct(seed, lit, size, 5);

  /* Hole fill: flood the *background* in from the border, then anything the
     flood never reached is inside the piece. */
  const outside = new Uint8Array(size * size);
  const q = [];
  for (let i = 0; i < size; i++) {
    q.push(i, (size - 1) * size + i, i * size, i * size + size - 1);
  }
  while (q.length) {
    const k = q.pop();
    if (outside[k] || solid[k]) continue;
    outside[k] = 1;
    const i = k % size, j = (k / size) | 0;
    if (i > 0) q.push(k - 1);
    if (i < size - 1) q.push(k + 1);
    if (j > 0) q.push(k - size);
    if (j < size - 1) q.push(k + size);
  }
  for (let k = 0; k < solid.length; k++) if (!outside[k]) solid[k] = 1;

  /* Feather: a box blur of the hard mask, remapped so the soft edge lands
     *inside* the silhouette and eats the last of the slate rather than
     leaving a rim of it. */
  const alpha = new Float32Array(size * size);
  const R = 2;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let sum = 0, n = 0;
      for (let b = -R; b <= R; b++) {
        const jj = j + b;
        if (jj < 0 || jj >= size) continue;
        for (let a = -R; a <= R; a++) {
          const ii = i + a;
          if (ii < 0 || ii >= size) continue;
          sum += solid[jj * size + ii];
          n++;
        }
      }
      alpha[j * size + i] = Math.max(0, Math.min(1, (sum / n - 0.45) / 0.4));
    }
  }

  const data = new Uint8ClampedArray(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const k = j * size + i;
      if (alpha[k] <= 0) continue;
      const [r, g, b] = s.rgb(x0 + i, y0 + j);
      data[k * 4] = r;
      data[k * 4 + 1] = g;
      data[k * 4 + 2] = b;
      data[k * 4 + 3] = Math.round(alpha[k] * 255);
    }
  }

  bleedColour(data, size, 4);
  return { size, data };
}

/** Chebyshev erosion by `r`, done as two separable passes. */
function erode(mask, size, r) {
  const tmp = new Uint8Array(size * size);
  const out = new Uint8Array(size * size);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let on = 1;
      for (let a = -r; a <= r && on; a++) {
        const ii = i + a;
        if (ii < 0 || ii >= size || !mask[j * size + ii]) on = 0;
      }
      tmp[j * size + i] = on;
    }
  }
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let on = 1;
      for (let b = -r; b <= r && on; b++) {
        const jj = j + b;
        if (jj < 0 || jj >= size || !tmp[jj * size + i]) on = 0;
      }
      out[j * size + i] = on;
    }
  }
  return out;
}

/**
 * The 4-connected blob covering most of the crop's middle, falling back to the
 * biggest blob if nothing reaches the middle at all.
 */
function centralComponent(mask, size, coreRadius) {
  const mid = size / 2;
  const seen = new Uint8Array(size * size);
  let best = null, bestCore = 0, bestArea = 0;

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const cells = [];
    const stack = [start];
    seen[start] = 1;
    let core = 0;
    while (stack.length) {
      const k = stack.pop();
      cells.push(k);
      const i = k % size, j = (k / size) | 0;
      if (Math.hypot(i - mid, j - mid) <= coreRadius) core++;
      const push = (n) => {
        if (mask[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      };
      if (i > 0) push(k - 1);
      if (i < size - 1) push(k + 1);
      if (j > 0) push(k - size);
      if (j < size - 1) push(k + size);
    }
    const better =
      core > bestCore || (core === bestCore && core > 0 && cells.length > bestArea) ||
      (bestCore === 0 && core === 0 && cells.length > bestArea);
    if (better) {
      bestCore = core;
      bestArea = cells.length;
      best = cells;
    }
  }

  const out = new Uint8Array(size * size);
  if (best) for (const k of best) out[k] = 1;
  return out;
}

/** `iterations` conditional dilations of `seed`, never leaving `bounds`. */
function reconstruct(seed, bounds, size, iterations) {
  let cur = seed;
  for (let n = 0; n < iterations; n++) {
    const next = cur.slice();
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const k = j * size + i;
        if (cur[k] || !bounds[k]) continue;
        if (
          (i > 0 && cur[k - 1]) ||
          (i < size - 1 && cur[k + 1]) ||
          (j > 0 && cur[k - size]) ||
          (j < size - 1 && cur[k + size])
        ) {
          next[k] = 1;
        }
      }
    }
    cur = next;
  }
  return cur;
}

/** Pushes RGB outward into transparent texels so mipmaps do not darken edges. */
function bleedColour(data, size, passes) {
  let filled = new Uint8Array(size * size);
  for (let k = 0; k < size * size; k++) filled[k] = data[k * 4 + 3] > 0 ? 1 : 0;

  for (let pass = 0; pass < passes; pass++) {
    const next = filled.slice();
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const k = j * size + i;
        if (filled[k]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (let dj = -1; dj <= 1; dj++) {
          for (let di = -1; di <= 1; di++) {
            const jj = j + dj, ii = i + di;
            if (jj < 0 || jj >= size || ii < 0 || ii >= size) continue;
            const kk = jj * size + ii;
            if (!filled[kk]) continue;
            r += data[kk * 4];
            g += data[kk * 4 + 1];
            b += data[kk * 4 + 2];
            n++;
          }
        }
        if (!n) continue;
        data[k * 4] = r / n;
        data[k * 4 + 1] = g / n;
        data[k * 4 + 2] = b / n;
        next[k] = 1;
      }
    }
    filled = next;
  }
}
