# Going live checklist

This is the full list of things to have in place before Juice Cartel starts trading and taking real payments. It covers both the website and the law.

**Read the legal section first.** These are not formalities — trading as a food business without them is against the law and can get the business shut down, or worse, make someone ill. None of the website setup work matters if this section isn't done.

---

## Legal requirements — do not skip these

These apply to you as a food business, regardless of how the website is built. Some cost money, all of them take real time to arrange, so start them early — several weeks before you plan to launch, not the week before.

- [ ] **Register the food business with Nottingham City Council.** This is **free** and **cannot be refused** — it's a registration, not a licence application, so there's no approval process to fail. It is a legal requirement to register **at least 28 days before you start trading**. Trading before you've registered, or without registering at all, is a criminal offence. This applies even though you're working from home — a home kitchen has exactly the same legal obligations as a commercial one. Do this first, today if possible: [GOV.UK — register a food business](https://www.gov.uk/guidance/food-business-registration).

- [ ] **Get a Level 2 Food Hygiene certificate. COSTS MONEY (roughly £20 online).** This is a short online course and test you can complete in an evening. It's the standard, widely accepted qualification for anyone handling and preparing food for sale.

- [ ] **Get a Safer Food Better Business (SFBB) pack.** This is a free pack from the Food Standards Agency that gives you the daily food safety diary and record-keeping system inspectors expect to see. Keep it up to date, not just filled in once.

- [ ] **Make sure allergen information is accurate for every single product**, and that it reaches the customer **twice**: once at the point of order (the website — see `docs/adding-products.md`), and again with the physical delivery (for example, on a label or slip attached to the order). This is a specific legal requirement for food sold at a distance, and it's the one place a mistake can genuinely hurt someone. Check every product on the site against its real ingredients before launch, not just the ones that seem obviously risky.

- [ ] **Get public liability insurance. COSTS MONEY (price varies — get a few quotes).** This covers you if a customer is harmed or their property is damaged because of your business, including from food-related illness. Search "public liability insurance food business" and compare a few providers — cost depends on your turnover and what you sell.

- [ ] **Have proper chilled transport ready: insulated cool bags and ice packs for every delivery.** Juice and dairy desserts need to stay cold from the moment they're made to the moment they're handed over. Buy enough cool bags and ice packs to cover your busiest delivery day, not just an average one.

- [ ] **Label shelf life honestly: "Keep refrigerated. Drink within 3 days."** Raw, cold-pressed juice that hasn't been through HPP (High Pressure Processing — a commercial pasteurisation-like process most small home producers do not have access to) safely lasts around **72 hours** refrigerated. **Do not claim a longer shelf life than this** — it's not just inaccurate, it's a food safety risk. Check every product's `keepsDays` value in `src/lib/catalogue.ts` reflects this honestly, and that the physical label on each item matches.

None of the technical steps below should go live until every box above is ticked.

---

## Technical setup

- [ ] Node.js and pnpm installed, and the site runs locally with `pnpm dev` (`SETUP.md` section 1).
- [ ] Stripe account created and **fully approved** (not just signed up — check you've received Stripe's approval confirmation, not only the welcome email) (`SETUP.md` section 2).
- [ ] A product photo uploaded for every item on the menu, using the exact filenames listed in `SETUP.md` section 8, at the recommended size.
- [ ] Every product's price, ingredients and allergens double-checked against reality in `src/lib/catalogue.ts` (`docs/adding-products.md`).
- [ ] Site imported into Vercel and deploying successfully, with no failed builds (`SETUP.md` section 5).
- [ ] Environment variables set correctly in Vercel, matching the names in `.env.example` exactly (`SETUP.md` section 5).
- [ ] The juicecartel.uk domain added in Vercel and its DNS records set at the domain registrar, with Vercel showing the domain as valid (`SETUP.md` section 7).
- [ ] Stripe webhook created pointing at `https://juicecartel.uk/api/webhook`, with the signing secret saved into Vercel (`SETUP.md` section 6).
- [ ] A full test order placed in **test mode** end to end — browse, basket, checkout with a Stripe test card, confirmation — and the order shows up correctly in the Stripe test dashboard (`SETUP.md` section 9).

---

## Switching from test to live

- [ ] Stripe account confirmed as fully approved for live payments (not just test mode).
- [ ] `STRIPE_SECRET_KEY` in Vercel changed from a `sk_test_...` key to the real `sk_live_...` key.
- [ ] A **separate** webhook created in Stripe's live mode (test and live webhooks are different, with different signing secrets), pointing at the same `https://juicecartel.uk/api/webhook` address.
- [ ] `STRIPE_WEBHOOK_SECRET` in Vercel updated to the **live** webhook's signing secret, not the test one.
- [ ] Vercel redeployed after updating the environment variables.

---

## Final checks before telling anyone the site is open

- [ ] **One real order placed with a real card**, by you, on the actual juicecartel.uk address, in live mode — and the payment confirmed as received in Stripe's live dashboard. Refund it afterwards if you don't want to keep the product.
- [ ] **Checkout tested on a real phone**, not just a laptop — most customers will order on their phone, and this is where layout or payment problems are most likely to show up first. Try it on both a small screen and a slower mobile connection if you can.
- [ ] A delivery run tested with an actual cool bag and ice packs, timed against your real delivery route, to confirm the juice is still properly cold on arrival.

Once every box on this page is ticked — legal, technical, and final checks — you're ready to open Juice Cartel to real customers.
