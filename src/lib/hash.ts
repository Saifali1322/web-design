/**
 * Deterministic pseudo-random, shared by the SVG hero and the 3D bottle so the
 * two render the same beads and bubbles.
 *
 * Lives here rather than next to either caller because both need it and neither
 * owns it — and because the previous arrangement (a copy in each) let the two
 * drift apart silently.
 */

/**
 * Deterministic pseudo-random in 0..1. Identical on server and client.
 *
 * Integer-only on purpose. The obvious shader-style version of this —
 * `fract(sin(seed * 127.1 + 311.7) * 43758.5453)` — is not portable: ECMAScript
 * lets every engine approximate `Math.sin` its own way, so Node and the browser
 * can disagree in the last bit or two. Multiplying by 43758.5453 drags that
 * error up into the digits we keep, and React then reports a hydration mismatch
 * on the SVG attributes built from it.
 *
 * `Math.imul` and the bitwise operators are exactly specified, so this returns
 * identical bits on every engine. The seed is quantised to a 1/4096 grid first
 * because callers pass floats (`seed * 13.7 + i * 3.1`); that multiply and
 * `Math.round` are both exact under IEEE 754.
 */
export function hashRandom(seed: number): number {
  let h = Math.round(seed * 4096) | 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
