# Scores

Weighted against `RUBRIC.md`. One row per capture run. Never edit an old row —
the point of the log is that regressions stay visible.

## Run: `baseline`

Before any work. `design-loop/runs/baseline/report.json`.

| # | Criterion | W | Score | Pts | Why |
|---|---|---|---|---|---|
| 1 | Product presentation | 3.0 | 3 | 9.0 | Every card drew a bottle because `public/products/` was empty. Real photography existed in `docs/reference/bottles/` but was never wired up. 50 failed image requests. |
| 2 | Hero | 2.0 | 8 | 16.0 | Genuinely strong. Dark/gold, script + roman pairing, real bottle art, a clear local promise. Best thing on the site. |
| 3 | Conversion path | 2.0 | 5 | 10.0 | Basket and checkout work, subscription exists. No bundles, no first-order incentive, no bestseller anchor, no urgency. |
| 4 | Brand voice | 1.5 | 6 | 9.0 | "Nothing sits in a warehouse — there isn't one" is excellent. Elsewhere it settles for describing juice. The name is the strongest asset and the copy under-uses it. |
| 5 | Mobile | 2.0 | 6 | 12.0 | No horizontal overflow anywhere. But 183 sub-24px tap targets across the site. |
| 6 | Typography | 1.5 | 8 | 12.0 | Confident scale and pairing. 2 heading-level skips. |
| 7 | Technical health | 1.5 | 2 | 3.0 | 50 console errors, 50 failed requests. Plus a cross-engine hydration mismatch and an invalid SVG attribute, both since fixed. |
| 8 | Accessibility | 1.5 | 6 | 9.0 | h1 on every route, alt coverage complete, no overflow. Held back by tap targets and heading skips. |
| 9 | Performance | 1.0 | 10 | 10.0 | Worst LCP 1012ms with nothing loading. Flattered by the missing images. |
| 10 | Trust and clarity | 1.0 | 7 | 7.0 | Allergen honesty, minimum order, delivery area and day all stated up front. No reviews or social proof. |

**Total 97.0 / 170 → 5.7 / 10**

## Run: `iter-02-graded`

Wired the four reference photos that match real products into `public/products/`
(cropped to the card's 4:5, then graded dark to sit with the drawn bottles).

| # | Criterion | W | Score | Pts | Δ |
|---|---|---|---|---|---|
| 1 | Product presentation | 3.0 | 5 | 15.0 | +6.0 |
| 7 | Technical health | 1.5 | 5 | 7.5 | +4.5 |
| 9 | Performance | 1.0 | 8 | 8.0 | −2.0 |

Everything else unchanged.

**Total 105.5 / 170 → 6.2 / 10**

Notes on this run:

- Product presentation moves 3 → 5, not higher. Four of thirteen products have a
  photograph, so the grid now mixes lifestyle shots with drawn bottles. The dark
  grade closes most of the gap but the framing still does not match: the drawn
  bottles are centred and vertical, the photographs are diagonal pours with
  props. **Partial photography is worth less than it looks** — coherence is what
  the reference sites win on.
- Technical health 2 → 5. Failed requests 50 → 28. The remaining 28 are the nine
  products with no photograph.
- Performance 10 → 8 is real, not noise: worst LCP 1012ms → 1700ms now that
  actual images load. It was never a 10; it was measuring an empty page.

### Next, in weighted-point order (superseded — see `iter-05`)

1. **Product presentation (3.0 × 5 gap = 15 pts available).** Needs the other
   nine photographed, on one background, at one framing. This is the single
   largest block of points on the board and code cannot supply it.
2. **Conversion path (2.0 × 5 = 10).** Bundles, a bestseller anchor, first-order
   capture. All buildable now.
3. **Mobile (2.0 × 4 = 8).** Find and fix the 183 sub-24px targets — likely a
   handful of components repeated, not 183 separate problems.

## Run: `iter-05`

Two changes, one of them to the harness rather than the site.

**Corrected the tap-target measurement.** The baseline's 183 "sub-24px targets"
was wrong. WCAG 2.2 SC 2.5.8 exempts targets that sit inline in a sentence, and
targets whose 24px centre-circles do not overlap. The harness applied neither, so
it was counting every inline link in every paragraph. With both exceptions
implemented: **183 exempt, 0 genuine failures.** Spot-checked the footer by hand —
links are 20px tall but nearest centre distance is 34–39px, comfortably past the
threshold. The site was already compliant; the meter was broken.

**Re-shot Classic Orange from `01-three-bottles-straight-on`.** The previous crop
came from the pour frame: a diagonal composition with props, next to drawn
bottles that are centred and vertical. The straight-on frame matches the drawn
cards' orientation, which was the actual coherence complaint.

| # | Criterion | W | Score | Pts | Δ from baseline |
|---|---|---|---|---|---|
| 1 | Product presentation | 3.0 | 6 | 18.0 | +9.0 |
| 2 | Hero | 2.0 | 8 | 16.0 | — |
| 3 | Conversion path | 2.0 | 5 | 10.0 | — |
| 4 | Brand voice | 1.5 | 6 | 9.0 | — |
| 5 | Mobile | 2.0 | 8 | 16.0 | +4.0 |
| 6 | Typography | 1.5 | 8 | 12.0 | — |
| 7 | Technical health | 1.5 | 5 | 7.5 | +4.5 |
| 8 | Accessibility | 1.5 | 8 | 12.0 | +3.0 |
| 9 | Performance | 1.0 | 8 | 8.0 | −2.0 |
| 10 | Trust and clarity | 1.0 | 7 | 7.0 | — |

**Total 115.5 / 170 → 6.8 / 10** (baseline 5.7)

Be clear about where those points came from: **7 of the 11.5 gained are a
measurement fix, not an improvement to the site.** Mobile and accessibility were
always this good. Only product presentation and technical health moved because of
work done to the product.

Product presentation is 6, not higher, because four of thirteen products have a
photograph and the four are graded lifestyle frames, not studio product shots.
Classic Orange still carries a visible pale wall behind it where the drawn cards
are near-black. Grading narrows that; it does not close it.

### Trap worth remembering

Next.js 16 caches optimised images at `.next/dev/cache/images`, not
`.next/cache/images`. Two capture runs reported a change that had not taken
effect because the wrong path was being cleared. If a photo swap appears to do
nothing, clear that directory and restart before believing the screenshot.

### Next, in weighted-point order

1. **Product presentation — 12 pts left.** Nine products unphotographed, and the
   four that exist want reshooting against a dark background at one framing.
   Photography, not code.
2. **Conversion path — 10 pts.** No bundles or variety pack, no first-order
   capture, no bestseller anchor on the homepage. All buildable now, and the
   largest thing code can still move.
3. **Brand voice — 6 pts.** The name is the strongest asset on the site and the
   copy mostly describes juice. Liquid Death is the reference.
4. **Trust — 3 pts.** No reviews or social proof anywhere.
