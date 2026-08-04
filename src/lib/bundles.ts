/**
 * Preset blends for the homepage's Build a Blend teaser.
 *
 * Three fixed starting points into the mixer rather than an empty glass, the
 * same way Mixer.tsx opens on a real blend rather than nothing. Each one is a
 * real BlendComponent list run through buildBlend, so the price, colour and
 * ingredients shown on the homepage are exactly what the mixer and the basket
 * would compute from the same ids — nothing here is a separate guess at the
 * number.
 */

import { buildBlend, type BlendComponent } from "./blend";

export interface Bundle {
  id: string;
  /** Shown instead of the blend's auto-generated name. */
  name: string;
  tagline: string;
  components: BlendComponent[];
}

const BUNDLES: Bundle[] = [
  {
    id: "sunrise-mix",
    name: "Sunrise Mix",
    tagline: "Orange out front, mango behind it",
    components: [
      { juiceId: "classic-orange", parts: 2 },
      { juiceId: "mango", parts: 1 },
    ],
  },
  {
    id: "tropic-storm",
    name: "Tropic Storm",
    tagline: "Pineapple and mango, nothing holding it back",
    components: [
      { juiceId: "pineapple", parts: 2 },
      { juiceId: "mango", parts: 1 },
    ],
  },
  {
    id: "berry-bright",
    name: "Berry Bright",
    tagline: "Watermelon cut with pomegranate",
    components: [
      { juiceId: "watermelon", parts: 2 },
      { juiceId: "pomegranate", parts: 1 },
    ],
  },
];

/** Every preset resolved once, at module load, so a bad id fails the build rather than the page. */
export const bundles = BUNDLES.map((bundle) => {
  const result = buildBlend(bundle.components);
  if (!result.ok) {
    throw new Error(`Bundle "${bundle.id}" does not build: ${result.error.message}`);
  }
  return { ...bundle, blend: result.blend };
});

export type ResolvedBundle = (typeof bundles)[number];
