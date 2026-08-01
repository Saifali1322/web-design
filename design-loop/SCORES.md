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

### Next, in weighted-point order

1. **Product presentation (3.0 × 5 gap = 15 pts available).** Needs the other
   nine photographed, on one background, at one framing. This is the single
   largest block of points on the board and code cannot supply it.
2. **Conversion path (2.0 × 5 = 10).** Bundles, a bestseller anchor, first-order
   capture. All buildable now.
3. **Mobile (2.0 × 4 = 8).** Find and fix the 183 sub-24px targets — likely a
   handful of components repeated, not 183 separate problems.
