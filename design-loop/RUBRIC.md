# Design loop — rubric

The target is 9.5/10. That number is meaningless unless it is anchored, so this
file fixes what each band means and which parts are measured rather than judged.

**Measured** criteria are scored from `design-loop/runs/<label>/report.json`,
produced by `capture.mjs`. They cannot be argued up.
**Judged** criteria are scored by eye against the screenshots from the same run,
with the reference set below as the 9.5 bar. Every judged score must cite what
would have to change to gain the next point — a score with no named next action
is not a score, it is an opinion.

## Reference bar (what 9.5 looks like)

| Site | Take from it |
|---|---|
| [Liquid Death](https://liquiddeath.com) | Brand voice as the differentiator. Dark, high-contrast, product-forward. Provocative imperatives instead of generic taglines ("MURDER YOUR THIRST"). Flavour-specific artwork inside a rigid card layout. |
| [Greenhouse](https://drinkgreenhouse.com) | Functional positioning over flavour lists — immunity, energy, digestion. A named `#1 BESTSELLER` anchor. Subscription-first architecture. First-order discount capture. |
| [Poppi](https://drinkpoppi.com) | Photography-first cards with almost no text. Per-flavour colour identity. Variety packs as the trial mechanic. Consistent condensation/chill treatment across every shot. |

Juice Cartel already owns the two hardest things on that list: a genuinely
distinctive name and a dark/gold identity that does not look like a template.
The gap is execution, not direction.

## Criteria

| # | Criterion | Weight | Type |
|---|---|---|---|
| 1 | Product presentation | 3.0 | judged |
| 2 | Hero and first impression | 2.0 | judged |
| 3 | Conversion path | 2.0 | judged |
| 4 | Brand voice and copy | 1.5 | judged |
| 5 | Mobile experience | 2.0 | mixed |
| 6 | Typography and hierarchy | 1.5 | mixed |
| 7 | Technical health | 1.5 | measured |
| 8 | Accessibility | 1.5 | measured |
| 9 | Performance | 1.0 | measured |
| 10 | Trust and clarity | 1.0 | judged |

Score each 0–10, multiply by weight, divide by 17 (the weight total).

## Measured thresholds

Read straight off `report.json` → `totals`.

| Criterion | 10 | 7 | 4 | 0 |
|---|---|---|---|---|
| Technical health | `consoleErrors` 0 and `failedRequests` 0 | ≤5 | ≤30 | >60 |
| Accessibility | `routesMissingH1` 0, `missingAlt` 0, `headingSkips` 0, `smallTargets` 0 | ≤10 small targets | ≤60 small targets | any route missing h1 |
| Performance | `worstLcp` ≤1200ms | ≤2000ms | ≤3500ms | >4000ms |
| Mobile (measured half) | `routesWithOverflowX` 0 | — | 1 route | ≥2 routes |

## Bands for judged criteria

- **9–10** — Nothing on the reference sites is being done better. A specific,
  deliberate choice is visible and it is right for this brand.
- **7–8** — Solid and coherent. Loses only to the references on polish or depth.
- **5–6** — Competent but generic. Would read the same for any juice brand.
- **3–4** — Actively inconsistent or unfinished. Visible defects.
- **0–2** — Broken or absent.

## Loop

1. `pnpm dev`, then `LABEL=<name> node design-loop/capture.mjs`.
2. Score all ten against this file. Append the row to `SCORES.md`.
3. Take the **lowest weighted-point contributor**, not the easiest fix.
4. Change one thing. Re-run. If the score did not move, revert it — the change
   was decoration.
5. Stop at 9.5, or when the remaining gap needs something code cannot supply
   (photography, recipes, reviews). Say which, rather than padding the score.
