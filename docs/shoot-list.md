# Shoot list

What to photograph, how, and what happens to it afterwards.

Photography is the largest remaining block of points in `design-loop/SCORES.md`
— worth more than everything else left combined. It is also the only part code
cannot supply.

**Read this first: you do not need a studio, a dark backdrop, or a good camera.**
Backgrounds get removed in software and the bottle is composited onto the site's
own gradient. What matters is light, angle and sharpness. A phone against a
plain wall is genuinely fine.

---

## 1. Product shots — 9 needed

One photograph per product. Filenames must match exactly; they come from
`src/lib/catalogue.ts` and the site looks for them in `public/products/`.

### Juice Cartel

| File | Product | Have |
|---|---|---|
| `classic-orange.jpg` | Classic Orange | ✅ |
| `orange-carrot.jpg` | Orange + Carrot | ✅ |
| `watermelon.jpg` | Watermelon | ✅ |
| `mango.jpg` | Mango | ✅ |
| `apple.jpg` | Apple | ❌ |
| `pineapple.jpg` | Pineapple | ❌ |
| `pomegranate.jpg` | Pomegranate | ❌ |

### Fuel Cartel

| File | Product | Have |
|---|---|---|
| `fuel-bueno.jpg` | Bueno | ❌ |
| `fuel-lotus.jpg` | Lotus | ❌ |
| `fuel-mars.jpg` | Mars | ❌ |
| `fuel-ramadan-sheikh.jpg` | Ramadan Sheikh | ❌ |

### Cartel Bakes

| File | Product | Have |
|---|---|---|
| `bruce-matilda-cake.jpg` | Bruce Matilda Cake | ❌ |
| `matilda-crunch-cake.jpg` | Matilda Crunch Cake | ❌ |

The four marked ✅ are cropped from `docs/reference/bottles/`. They work, but
they are lifestyle frames rather than product shots — reshoot them with the rest
if you can and everything matches properly.

### How to shoot them

**Setup.** Bottle upright on a flat surface, plain wall behind it. Any colour,
as long as it is plain and is not the same colour as the juice — a white or grey
wall is ideal, and the wall in `01-three-bottles-straight-on.jpeg` already
works. Wipe the bottle first; fingerprints and smears are the one thing software
cannot fix.

**Light.** Daylight from a window, to one side, bottle side-on to it. Never use
the phone's flash — it blows out the label and kills the glow through the juice.
Overcast daylight is better than direct sun. Whatever you pick, use the same
light for all thirteen: consistency between shots matters far more than any
single shot being beautiful.

**Angle.** Camera at label height, straight on, not looking down at it. This is
the one that matters most — the drawn bottles on the site are dead vertical, and
a shot taken from above will never sit beside them. Step back and zoom slightly
rather than moving the phone closer; it keeps the bottle from bulging.

**Framing.** Portrait. Whole bottle including the cap, with a hand's width of
space above and below. Label facing the camera, level, centred. Nothing else in
frame — no fruit, no hands, no other bottles.

**Fill.** Photograph them full, with the foam head settled. Fresh juice
separating into a lighter head is a selling point and the site already draws it.

**Format.** Highest quality your phone offers, HEIC or JPEG both fine. Do not
crop, filter, or run them through Snapchat or Instagram. Send the originals.

### What must not be in the frame

The existing photos show why:

- **Burned-in captions.** `05-watermelon-pour` has "ALL FRESH NO ADDITIVES"
  stickered across it. Croppable, but it cost the best part of the frame.
- **Platform watermarks.** `03-mango-sunset` carries the TikTok handle. Fine on
  TikTok, reads as second-hand on a product card.
- **Props and hands.** Lovely for social, wrong for a grid — they break the
  rhythm when every other card is a plain bottle.

Shoot clean versions for the site. Keep the lifestyle shots; they belong
elsewhere on the page, just not in the product grid.

---

## 2. The label — 1 flat scan, highest value single image

**This is the highest-return image on the list.** Ask for it even if nothing
else gets done.

The circular label is currently *redrawn in code*, twice: once as SVG in
`BottleArt.tsx`, once painted onto a canvas texture for the 3D bottle in
`bottleTextures.ts`. Both are careful reconstructions of a photograph — the
arced `FRESHLY MADE`, the bottle-and-droplet mark, `JUICE CARTEL`, `330ml`,
`Apart of EK Entrepreneurship`. Good reconstructions, but reconstructions.

One flat scan replaces both with the real artwork, and every bottle on the site
— hero, cards, 3D viewer — gets the genuine label at once.

**What I need:** an unused sticker laid flat, photographed or scanned straight
down, filling the frame, evenly lit, no glare, no curve. 2000px across or more.
A flatbed scan is perfect. A phone directly above it on a windowsill is fine.

**Better still:** if you have the original artwork from whoever printed them —
`.ai`, `.pdf`, `.svg`, `.eps` — send that instead. Vector means the label stays
sharp at any size and I can pull the exact brand gold rather than sampling it
off a photograph.

---

## 3. Optional — 3D turntable

Only if you fancy it. The "Spin it" viewer currently renders a generated bottle.
A real turntable would replace it with the actual product.

Bottle on a plate or lazy susan, camera fixed, rotate the bottle a little at a
time and shoot: 24 frames at 15° apart, or 36 at 10°. Same light throughout,
label facing camera on frame 1. Name them `spin-01.jpg` … `spin-24.jpg`.

Skip if it is a faff. The generated bottle is good and this is a nice-to-have.

---

## 4. What happens to them

Once the files land, this runs automatically:

1. **Background removed** — `rembg` (U²-Net) cuts the bottle out. Verified
   working on `01-three-bottles-straight-on`: clean edges through the cap
   ribbing and the shoulder, no halo.
2. **Composited** onto the same dark gradient the drawn cards use, so a photo
   card and a drawn card sit at identical value. This is what actually fixes the
   coherence problem in `SCORES.md`, and it is why the backdrop you shoot
   against does not matter.
3. **Cropped to 4:5** at 1000×1250, matching `aspect-[4/5]` on the card.
4. **Colour sampled** — `accent` and `accentDeep` in `catalogue.ts` are meant to
   trace back to real pixels. New photographs mean re-sampling them from the
   real juice instead of the current values, which were read off the reference
   frames.
5. **Transparent cutouts kept** as PNG for the hero, where the bottle needs to
   sit over the particle field with nothing boxed around it.

### On motion

The site's motion — the hero parallax, the particle field, the bottle glow — all
runs on generated art, not photographs. A cutout with a real alpha channel is
what lets a photographed bottle join in: it can be layered over the particles,
parallaxed against the background, and given the same glow, because there is no
rectangular edge to give it away. That is the practical reason step 5 exists,
and the reason "shoot it against anything plain" is sound advice rather than a
shortcut.

---

## Summary

| Priority | What | Count |
|---|---|---|
| 1 | Flat label scan, or the original vector artwork | 1 |
| 2 | Product shots, plain wall, straight on, no props | 9 |
| 3 | Reshoots of the four lifestyle frames | 4 |
| 4 | Turntable sequence, optional | 24 |

Send them however is easiest — the originals, unedited.
