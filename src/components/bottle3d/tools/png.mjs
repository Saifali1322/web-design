/**
 * A PNG codec in ~150 lines, built on Node's own zlib.
 *
 * This exists so the asset pipeline in `extract.mjs` can read the product
 * photography and write the cropped label / fruit cutouts without adding a
 * dependency. `sharp` is not installed and pulling in a native image library
 * (or a headless Chromium) to crop seven squares out of seven PNGs would cost
 * more — in install time, in lockfile churn, in CI surface — than the format
 * actually demands. PNG is DEFLATE plus five per-scanline filters, and zlib is
 * in the standard library; the rest is the loop below.
 *
 * Scope is deliberately narrow: 8-bit, non-interlaced, colour types 2 (RGB)
 * and 6 (RGBA) on the way in, always colour type 6 on the way out. That covers
 * every file in `public/products/`. Anything else throws rather than guessing.
 *
 * Build-time only. Nothing here ships to the browser.
 */

import zlib from "node:zlib";

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/* ------------------------------------------------------------------ *
 * Decode
 * ------------------------------------------------------------------ */

/**
 * @param {Buffer} buf
 * @returns {{ width: number, height: number, data: Uint8ClampedArray }} RGBA,
 *   row-major, 4 bytes per pixel.
 */
export function decodePNG(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  for (let p = 8; p < buf.length; ) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const body = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      if (body[12] !== 0) throw new Error("interlaced PNG unsupported");
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    p += 12 + len; // length + type + body + CRC
  }

  if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} unsupported`);
  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 0;
  if (!channels) throw new Error(`colour type ${colorType} unsupported`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8ClampedArray(width * height * 4);

  /* Un-filter in place into `line`, keeping the previous reconstructed row for
     the Up/Average/Paeth predictors. */
  let prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = src[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      else if (filter !== 0) throw new Error(`bad filter ${filter}`);
      line[i] = v & 0xff;
    }

    const o = y * width * 4;
    if (channels === 4) {
      for (let i = 0; i < stride; i++) out[o + i] = line[i];
    } else {
      for (let x = 0; x < width; x++) {
        out[o + x * 4] = line[x * 3];
        out[o + x * 4 + 1] = line[x * 3 + 1];
        out[o + x * 4 + 2] = line[x * 3 + 2];
        out[o + x * 4 + 3] = 255;
      }
    }
    prev = Buffer.from(line);
  }

  return { width, height, data: out };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/* ------------------------------------------------------------------ *
 * Encode
 * ------------------------------------------------------------------ */

/**
 * RGBA → an 8-bit colour-type-6 PNG.
 *
 * Filters are chosen per row by the minimum-sum-of-absolute-differences
 * heuristic from the PNG spec's own encoding notes. It is not optimal, but on
 * photographic crops it beats a fixed filter by 15–25% and costs one extra
 * pass over the row.
 *
 * @param {number} width
 * @param {number} height
 * @param {Uint8ClampedArray} data
 * @returns {Buffer}
 */
export function encodePNG(width, height, data) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  const cand = [Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride)];

  for (let y = 0; y < height; y++) {
    for (let i = 0; i < stride; i++) cur[i] = data[y * stride + i];

    let best = 0;
    let bestScore = Infinity;
    for (let f = 0; f < 5; f++) {
      const buf = cand[f];
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= 4 ? cur[i - 4] : 0;
        const b = prev[i];
        const c = i >= 4 ? prev[i - 4] : 0;
        let v;
        if (f === 0) v = cur[i];
        else if (f === 1) v = cur[i] - a;
        else if (f === 2) v = cur[i] - b;
        else if (f === 3) v = cur[i] - ((a + b) >> 1);
        else v = cur[i] - paeth(a, b, c);
        v &= 0xff;
        buf[i] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        best = f;
      }
    }

    raw[y * (stride + 1)] = best;
    cand[best].copy(raw, y * (stride + 1) + 1);
    cur.copy(prev);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // 10..12: deflate, adaptive filtering, no interlace — all zero already.

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, "ascii");
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)) >>> 0, 8 + body.length);
  return out;
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}
