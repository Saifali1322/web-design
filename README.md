# Juice Cartel

The ordering website for Juice Cartel — cold-pressed juice, milkshakes and desserts, delivered around Nottingham. Customers browse the menu, buy one-off items or a weekly subscription, and pay by card through Stripe.

Not a developer? Start with **[SETUP.md](./SETUP.md)** instead — it's the owner-facing guide to running, deploying and configuring the site with no prior experience assumed.

## Stack

- **[Next.js 16](https://nextjs.org)** (App Router) — React framework, deployed on Vercel.
- **React 19** + **TypeScript**.
- **Tailwind CSS 4** for styling.
- **[Stripe](https://stripe.com)** (`stripe`, `@stripe/stripe-js`) for checkout and payments.
- **Zod** for runtime validation (request/webhook payloads).
- **pnpm** as the package manager.

## Running locally

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
pnpm build   # production build
pnpm start   # run the production build locally
```

Stripe-dependent routes degrade gracefully with no keys present — see `src/lib/env.ts`. To exercise payments locally, copy `.env.example` to `.env.local` and fill in a Stripe **test** secret key (`STRIPE_SECRET_KEY`) and webhook secret (`STRIPE_WEBHOOK_SECRET`); use the Stripe CLI (`stripe listen`) to forward webhook events to your local server.

## File layout

```
src/
  app/                    Routes (App Router). Pages, metadata, sitemap/robots.
  components/
    brand/                Logo and brand assets.
    cart/                 CartProvider (basket state, localStorage-persisted) and cart UI.
    chrome/                SiteHeader / SiteFooter.
  lib/
    catalogue.ts          Single source of truth for products, prices, subscription
                           tiers, delivery rules and postcode coverage. Edit this to
                           change anything customers see or buy — see
                           docs/adding-products.md.
    stripe.ts             Lazily-constructed server-side Stripe client.
    env.ts                Validated access to Stripe/site environment variables.
                           Nothing here throws at build time — only inside request
                           handlers, so the app builds and renders with no keys set.
public/
  products/                Product photography, filenames matched to catalogue.ts.
  brand/                  Logo/brand image assets.
docs/
  adding-products.md      How to add, edit, reprice or remove a catalogue item.
  going-live-checklist.md Technical and legal pre-launch checklist.
```

Notable conventions:

- **Prices are in pence** everywhere (`price: 450` = £4.50), to match Stripe's integer-pence amounts and avoid float rounding. See `docs/adding-products.md` for details before editing anything price-related.
- **Allergens** on each product are a legal requirement for distance-sold food, not decoration — see the comment block at the top of `src/lib/catalogue.ts` and `docs/adding-products.md`.
- The Stripe webhook endpoint is expected at `/api/webhook`; `/api/` and `/order/` are excluded from search indexing in `src/app/robots.ts`.

## Owner-facing docs

- **[SETUP.md](./SETUP.md)** — running the site, creating a Stripe account, deploying to Vercel, DNS, environment variables, webhooks, product photos, and testing an order end to end. Written for a non-technical owner.
- **[docs/adding-products.md](./docs/adding-products.md)** — editing the catalogue.
- **[docs/going-live-checklist.md](./docs/going-live-checklist.md)** — technical and legal checklist before trading for real.
