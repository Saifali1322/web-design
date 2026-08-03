/**
 * Which photograph the hero shows, and how it is found.
 *
 * Everything here is convention, not configuration. A juice's hero shot lives
 * at `/products/<product.image>` — the same file the menu card already uses —
 * so adding a flavour is a catalogue entry plus a file, and nothing in the
 * hero has to learn about it.
 *
 * The one thing the hero must never do is ask for a file that is not there:
 * a 404 per flavour per session is a console full of noise and, on a slow
 * connection, a visible hole where the product should be. So availability is
 * resolved on the server (see `components/home/Hero.tsx`, which reads the
 * directory at build time) and handed down as a plain list of ids. The client
 * only ever renders images it has been told exist, and the `onError` guard in
 * the hero is a second line of defence for a file that is present but broken.
 */

import type { Product } from "@/lib/catalogue";

export interface HeroShot {
  /** Stable identity, so the crossfade can tell two layers apart. */
  key: string;
  src: string;
  /** Intrinsic size. Only used to hold the aspect ratio honest. */
  width: number;
  height: number;
  alt: string;
  /** 14px WebP, ~150 bytes. See the note on BLUR below. */
  blurDataURL: string;
  /**
   * How this shot is fitted to the stage, because the two kinds of
   * photograph want opposite things and the stage is one fixed box.
   *
   * The group shot is a tall frame with a lot of empty air above the caps and
   * a reflection running off the bottom; contained, the bottles end up
   * occupying about a third of the stage and the hero looks like a thumbnail.
   * It wants covering, cropped to the mass.
   *
   * The individual shots are square and composed edge to edge — the splash
   * and the cut fruit fan right out to the corners, which is most of what
   * makes them good. Any crop takes the best part off, so they are contained.
   */
  fit: "cover" | "contain";
  /** Where the crop is anchored. Only meaningful for `cover`. */
  focus: string;
}

/* ------------------------------------------------------------------ *
 * Blur placeholders
 *
 * Baked rather than computed: these are 14px-wide WebP thumbnails, about
 * 130 bytes each, so all eight together cost roughly a kilobyte of HTML and
 * the hero has a warm, correctly-coloured field to arrive into instead of a
 * black hole. They were produced at authoring time with the `sharp` that
 * already ships inside next's dependency tree — nothing imports it at
 * runtime, and package.json is untouched.
 *
 * To regenerate after new photography lands:
 *
 *   sharp(file).resize(14).webp({ quality: 40 }).toBuffer()
 *     → "data:image/webp;base64," + buf.toString("base64")
 *
 * A missing entry is not an error. `blurFor` returns undefined and the layer
 * simply fades up over the glow behind it, which is a perfectly good arrival.
 * ------------------------------------------------------------------ */

const BLUR: Record<string, string> = {
  "hero/lineup.png":
    "data:image/webp;base64,UklGRp4AAABXRUJQVlA4IJIAAADQBACdASoOABMAPu1iqU2ppaOiMAgBMB2JbACdMoR3H0zATH7u8Qruq+Sw+xMREAD+9DKj6aG3OArsZ0+mxjdj7HOs8ADqvrCXq9t6B/bWD5JWxL12Mtxy7ejeXNnvTt+6Ao6lVRatVjA6JzKpbLmMCTX+ksTcgJR5Xr1G9Z5ZNxxrBOE4xGfLLMs5dk5JSwAAAA==",
  "classic-orange.png":
    "data:image/webp;base64,UklGRoAAAABXRUJQVlA4IHQAAAAQAgCdASoOAA4AA4BaJbACdAC6iMFbALAAAP724F+a9SHG3Bdcxj/Wu0usznEHWOLUAaycjUiH93zLKzxHeLJ99BSGxBxlXchtXHM+C+XvTwCmPgSi9Zv7Ktt+Wk1iCmpn8XUYkv4cLtHChoryrZcKfZqAAA==",
  "apple.png":
    "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAABwAgCdASoOAA4AA4BaJbACdAYw7a9/EON07Y0IAP724FZS2O6MbvxzxG2ZkQf7esfJuMlwlFHEnspLRCsCbeD4najidmFkoSm9XvLTgox0pc18/gQMH7niOtiaFthQV3ku5D8LI5qkkZ4JNszZQAAA",
  "pineapple.png":
    "data:image/webp;base64,UklGRn4AAABXRUJQVlA4IHIAAAAwAgCdASoOAA4AA4BaJbACdAYv/aF44AeZAAD+98ZIhFORU1F9BnM07vkL7bWFsYdm7d8CnGFW/MxQh0kVNx2+8dCO5n/4t8ftoh3ALhT0w6vv7e2p2BJJJjQiFNkuDKbcmdo6hv4DeLyXTVoQSmuMAAA=",
  "orange-carrot.png":
    "data:image/webp;base64,UklGRowAAABXRUJQVlA4IIAAAAAQAgCdASoOAA4AA4BaJbACdAYwxaeXt7okAP73xkiEU5Fak/0Gc0M/40ShuKeOHhQph2puHHtO8tcv2NF9X3xndkTwCSwvCpTNUHerLfr+AUMfLuQPFn+cTY8jPMnt+F20/RaOod9brcS1fAUlhkZpDvOg+NUAAnYGpG12AoAAAA==",
  "watermelon.png":
    "data:image/webp;base64,UklGRnQAAABXRUJQVlA4IGgAAAAwAgCdASoOAA4AA4BaJbACdADcm+UzmoyX3AD+98YyqHB7fij8w8Vpia33aRZeeebtiCcZMULlM4+7FcMW0qGPMR6UCFg1CnAwIbTLfX9/uQeIwUCydT6XqLyug0sx45RtCCYoVGoeAA==",
  "pomegranate.png":
    "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAQAgCdASoOAA4AA4BaJbACdAC8wX1boySAAP73xZ+9rJ8ejfb94Hgtu87dG/3/I6vEDCOyffKLHZPK2WRClWDNOaHu72BAiHUoDMvzYASFsw0nVAAAAA==",
  "mango.png":
    "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAABwAgCdASoOAA4AA4BaJbACdGaAED0TaRGmK84AAP73xlCtE/o6fZD7Q8g1JHAVyjacjJGENmDDx98xd3S/l9XgNsVjg8NSiG/TgnZBVYbL8Hy5vysT7HacDHli0A2RFSc0pvtBTwAMprU+erlQgjsnglINSZYJ75S2tYAA",
};

/* ------------------------------------------------------------------ *
 * The lineup
 * ------------------------------------------------------------------ */

/**
 * The resting shot: all seven bottles on the plinth. This is the LCP image on
 * every first paint, so it is the only one the page ever preloads.
 */
export const LINEUP: HeroShot = {
  key: "lineup",
  src: "/hero/lineup.png",
  width: 896,
  height: 1195,
  alt:
    "All seven Juice Cartel juices in 330ml bottles — orange, apple, " +
    "pineapple, orange and carrot, watermelon, pomegranate and mango — " +
    "arranged on a black plinth above a spray of juice and cut fruit.",
  blurDataURL: BLUR["hero/lineup.png"],
  fit: "cover",
  /* Slightly above centre: the crop then loses the empty air over the caps
     and the far end of the reflection, and keeps every bottle and the whole
     fan of fruit. Nudging this past about 0.6 starts cutting the caps. */
  focus: "50% 55%",
};

/**
 * Every individual shot is square, one bottle centred with its fruit thrown
 * wide around the base. Quoted here rather than measured because the stage
 * needs the ratio before the file has loaded, and because a shot that is not
 * square is a shot that has not been cut to match the set.
 */
const SHOT_SIZE = 1024;

/**
 * The photograph for one juice, or null if there isn't one yet.
 *
 * `available` is the list of files the server found. Passing null means "no
 * list was resolved" — the hero then stays on the lineup rather than
 * speculatively requesting seven files that may not exist.
 */
export function shotFor(
  product: Product,
  available: ReadonlySet<string> | null,
): HeroShot | null {
  if (!product.image) return null;
  if (!available || !available.has(product.image)) return null;

  /* The fruit noun the catalogue already carries reads better in an alt than
     the product name repeated twice ("Mango — a bottle of Mango juice"). */
  const fruit = product.fruit ?? product.name.toLowerCase();

  return {
    key: product.id,
    src: `/products/${product.image}`,
    width: SHOT_SIZE,
    height: SHOT_SIZE,
    alt:
      `${product.name} — a ${product.size} bottle of Juice Cartel ` +
      `${product.name.toLowerCase()} juice on a black plinth, with fresh ` +
      `${fruit} and a splash of juice thrown around it.`,
    blurDataURL: BLUR[product.image],
    fit: "contain",
    focus: "50% 50%",
  };
}

/**
 * Widths the stage actually occupies, in the order the breakpoints fire.
 *
 * This has to track the layout below it or `next/image` fetches the wrong
 * candidate — too small and the hero is soft, too large and a phone downloads
 * a desktop image, which is the whole LCP problem this hero was rebuilt to
 * avoid. The bands are: phone (single column, full bleed), tablet (single
 * column, capped at 30rem), small desktop (the right-hand grid column plus
 * the 4rem it bleeds past the container), and finally the capped container,
 * where the column stops growing at 34rem and the bleed takes it to 38rem.
 */
export const HERO_SIZES =
  "(max-width: 767px) 92vw, (max-width: 1023px) 30rem, (max-width: 1279px) 53vw, 38rem";
