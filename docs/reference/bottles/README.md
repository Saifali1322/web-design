# Real product reference

Photographs of the actual Juice Cartel bottle. **These are the source of truth
for every drawn bottle on the site** — the SVG in `src/components/hero/BottleArt.tsx`
and the lathe geometry in `src/components/bottle3d/`.

Before this folder existed, both were built from a written description of the
product rather than the product, which is why the hero, the menu cards and the
360° viewer all drifted into looking like three different bottles, none of them
ours. Anything that draws a bottle should be checked against these images.

| File | Use it for |
|---|---|
| `01-three-bottles-straight-on.jpeg` | **Primary.** Silhouette, proportions, cap, label layout, foam head. Straight-on, three bottles, even light. |
| `02-orange-carrot-held.jpeg` | The `JC.` wordmark below the label. Gloss and specular behaviour on PET. |
| `03-mango-sunset.jpeg` | Backlit glass — how the liquid reads with light behind it. |
| `04-orange-pour-kitchen.jpeg` | Neck threads, open bottle, pour. Orange and pomegranate colour. |
| `05-watermelon-pour.jpeg` | Neck threads close up. Watermelon colour and its pale foam. |

## What the real bottle actually is

A clear PET **milk-bottle / carafe** shape, not the slim tapered bottle first
drawn. Points that were wrong before and are easy to get wrong again:

- **Cap** — tall, wide, *translucent natural white* PET with fine vertical
  ribbing. It is not a metallic grey cylinder.
- **Neck** — short, clear, with **visible screw threads** (three to four rings).
  These read clearly on an unfilled bottle and are a large part of why the real
  thing looks like a real thing.
- **Shoulder** — a pronounced round turn from the full body width in to the
  neck, over a short vertical distance.
- **Body** — near straight-walled, only a slight draft toward the base.
- **Liquid** — filled high, up into the shoulder, with a distinctly lighter
  **foam / pulp head** floating on top. Fresh pressed juice separates; a flat
  slab of colour reads as squash.
- **Label** — circular matte black sticker, thin gold ring, gold type:
  `FRESHLY MADE` arced over the top, a gold line-art bottle-with-droplet mark,
  `JUICE` / `CARTEL`, `330ml`, and `Apart of EK Entrepreneurship` arced along
  the bottom.
- **`JC.`** — printed in white on the bottle below the label.

## Colours

Sample them from these photographs rather than inventing them. The values in
`src/lib/catalogue.ts` should trace back to real pixels.
