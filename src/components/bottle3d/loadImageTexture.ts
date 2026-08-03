/**
 * Decoding the photographic crops into textures, without ever taking the page
 * down with them.
 *
 * Everything the viewer loads from `/bottle3d/` is an enhancement over
 * something that already works — the drawn label, and no fruit at all — so a
 * 404, a decode failure or an offline visitor has to be a shrug, not a throw.
 * Hence: never rejects, always resolves, `null` means "carry on without it".
 *
 * Reached only from `BottleScene`, so it stays inside the lazy renderer chunk
 * along with the rest of three.js.
 */

import { LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, Texture } from "three";

/** Loaded textures are the caller's to dispose. */
export function loadImageTexture(
  url: string,
  anisotropy: number,
): Promise<Texture | null> {
  return new Promise((resolve) => {
    const img = new Image();
    /* Same-origin assets out of /public, but the attribute has to be set
       before `src` or a future CDN move would start tainting the canvas. */
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    const done = (tex: Texture | null) => {
      img.onload = null;
      img.onerror = null;
      resolve(tex);
    };

    img.onload = () => {
      const tex = new Texture(img);
      tex.colorSpace = SRGBColorSpace;
      tex.minFilter = LinearMipmapLinearFilter;
      tex.magFilter = LinearFilter;
      tex.anisotropy = anisotropy;
      tex.needsUpdate = true;
      done(tex);
    };
    img.onerror = () => done(null);
    img.src = url;
  });
}

/**
 * Loads several at once and hands back only the ones that made it.
 *
 * Indices are preserved as `null` holes rather than compacted, because the
 * caller pairs each texture with a layout entry by position.
 */
export function loadImageTextures(
  urls: readonly string[],
  anisotropy: number,
): Promise<(Texture | null)[]> {
  return Promise.all(urls.map((u) => loadImageTexture(u, anisotropy)));
}
