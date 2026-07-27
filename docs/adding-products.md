# Adding, editing or removing products

Every product on the site — every juice, milkshake, dessert and shot — comes from one file:

```
src/lib/catalogue.ts
```

Nothing about prices, names, descriptions or allergens lives anywhere else. Change something here, and once it's saved and pushed to GitHub, Vercel republishes the live site automatically within a couple of minutes (see `SETUP.md` section 5).

You can open and edit this file in two ways:
- **On GitHub's website**: find the file in your repository, click the pencil (edit) icon, make your change, and click "Commit changes" at the bottom. No installation needed, works from any computer.
- **On your own computer**: if you've set up the project locally (`SETUP.md` section 1), open the file in any plain text editor and run `pnpm dev` to preview your change at `localhost:3000` before it goes live.

Either way, save carefully — this is a code file, so punctuation matters (explained below).

---

## A full annotated example

Here is one real product from the file, with a note on every line:

```ts
{
  id: "mango-juice",              // A short, unique code for this product.
                                   // Lower-case, words joined with a hyphen.
                                   // Never reuse an id — the shopping basket
                                   // and past orders refer to products by id.

  name: "Mango",                  // The name shown to customers.

  tagline: "The one that sells out",   // A short line under the name on the
                                        // product card. Keep it brief.

  description:
    "Alphonso mango pressed thick and cold. No water, no concentrate, " +
    "no sugar added — it pours like a smoothie and drinks like dessert.",
                                   // The longer description shown on the
                                   // product page.

  category: "juice",              // Must be one of: "juice", "shake",
                                   // "dessert", or "shot". This controls
                                   // which section of the menu it appears in.

  price: 450,                     // The price IN PENCE. 450 means £4.50.
                                   // See "Why pence, not pounds" below —
                                   // get this wrong and you overcharge or
                                   // undercharge every customer.

  size: "330ml",                  // The serving size shown on the label.

  ingredients: ["Mango", "Orange", "Lime"],
                                   // A plain list of what's in it, shown to
                                   // customers. List every real ingredient —
                                   // this is what people are buying.

  allergens: [],                  // The allergens this product contains.
                                   // Empty [] means none. See "Allergens are
                                   // not optional" below — this must be
                                   // accurate.

  image: "mango-juice.jpg",       // The filename of the product photo,
                                   // which must exist in /public/products/
                                   // with this EXACT name. See SETUP.md
                                   // section 8 for photo requirements.

  accent: "#F2A81D",              // A colour (in hex code, e.g. from a
                                   // colour picker tool) used for a subtle
                                   // glow behind this product's card. Purely
                                   // decorative — pick something that suits
                                   // the product, e.g. orange for mango.

  bestseller: true,               // Optional. Add this line to show a
                                   // "bestseller" badge. Leave it out
                                   // entirely for products without the badge.

  keepsDays: 3,                   // How many days this keeps in the fridge.
                                   // Shown to customers as an honesty note.
                                   // Must be accurate — see the shelf-life
                                   // warning in going-live-checklist.md.
},
```

Every product in the file follows this same shape. To see more real examples, scroll through the `products` array in `src/lib/catalogue.ts`.

---

## Why prices are in pence, not pounds

Every price in this file is a whole number of **pence**. `450` means £4.50. `1200` means £12.00.

This is deliberate, and it matters:

- Computers can make small rounding errors with amounts like "£4.50" (fractions of a penny can creep in during calculations). Whole numbers of pence avoid that entirely.
- Stripe, the payment company this site uses, also works in pence internally — so keeping prices in pence here means the amount shown to a customer and the amount actually charged always match exactly.

**When you change a price, always convert pounds to pence by multiplying by 100.** £5.00 becomes `500`. £7.99 becomes `799`. If you accidentally type `5` instead of `500`, you will charge a customer 5 pence instead of £5 — always double check.

---

## Allergens are not optional

The `allergens` field is not a nice-to-have — it's a legal requirement. Under UK food law, allergen information for food sold at a distance (which includes anything ordered online for delivery) must be accurate and must reach the customer **both when they order and again with the delivery**. Getting this wrong can make someone seriously ill, and can also mean regulatory action against the business.

Rules for editing this field:

1. List **every** allergen the product actually contains, not just the obvious ones. Check every ingredient, including things like flavourings, spreads and pre-made mixes, which often contain milk, soya or gluten without it being obvious from the name.
2. The current list of allergen types available in the code is:

   `milk`, `eggs`, `wheat`, `gluten`, `soya`, `nuts`, `peanuts`, `sesame`

   This covers everything currently on the menu. If you add a product containing an allergen **not** in this list (for example, celery, mustard, fish, shellfish, sulphites or lupin — all legally recognised UK allergens), the code needs a small change by a developer first, to add the new allergen type before you can select it. Do not skip labelling an allergen just because it isn't in the list yet — get the code updated instead.
3. When in doubt, ask whoever supplies your ingredients for their own allergen information, and check the packaging of anything pre-made (like Biscoff spread or mini eggs) rather than guessing.
4. Remember this information also needs to reach the customer again at the point of delivery (for example, on a label or note with the order) — the website showing it correctly is only half the legal requirement. See `docs/going-live-checklist.md`.

---

## Adding a new product

1. Open `src/lib/catalogue.ts`.
2. Find the `products` array (it starts with `export const products: Product[] = [`).
3. Copy an existing product's entire block, from the opening `{` to the closing `},`, and paste it either just before the closing `];` of the array, or anywhere between two other products.
4. Edit every field as described above. In particular:
   - Give it a new, unique `id`.
   - Set a `price` in pence.
   - List its real `ingredients` and `allergens`.
   - Choose an `image` filename, then make sure a photo with that exact filename is uploaded to `public/products/` (see `SETUP.md` section 8).
5. Save (or commit, if editing on GitHub). Check the live site after Vercel rebuilds to confirm the new product appears correctly, with a working photo and correct price.

## Editing or repricing an existing product

Find the product's block (search for its `name` or `id`) and change whichever fields need updating — most commonly `price`. Remember: pence, not pounds. Save and the change goes live automatically.

## Removing a product

Delete the entire block for that product, from its opening `{` to its closing `},`, including everything in between. Be careful not to delete the comma or brace belonging to a neighbouring product. Save, and it disappears from the live menu after the next rebuild. You can leave its photo in `public/products/` — an unused photo does no harm — or delete it too, it's your choice.

---

## Subscription tiers

The three weekly subscription boxes (The Reset, The Weekly, The Household) work the same way, in the `subscriptionTiers` array further down the same file. Each has a `price` (in pence, per week), a `listPrice` (what the same items would cost bought separately, used to show the saving), and an `includes` list of bullet points shown to customers. Edit these the same way as products — find the block, change the field, save.

---

## A note on breaking the file

This is a real code file — every product needs a matching comma, and every quote mark, brace `{}` and bracket `[]` needs its opposite. If you're not confident editing it directly, the safest approach is:

- Only ever change the value inside quotes or after a colon (for example, changing `450` to `500`, or changing text inside `"..."`).
- Don't remove or add braces `{}`, brackets `[]` or commas unless you're copying a complete block as described above.
- If the site fails to build after a change (Vercel will show a failed deployment), the most common cause is a missing comma or an unclosed quote — compare your edit carefully against a working product above or below it, or ask a developer to take a quick look.
