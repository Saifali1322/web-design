# Adding, editing or removing products

Every product on the site — every juice, protein shake and bake — comes from one file:

```
src/lib/catalogue.ts
```

Nothing about prices, names, descriptions or allergens lives anywhere else. Change something here, and once it's saved and pushed to GitHub's `main` branch, Vercel republishes the live site automatically within a couple of minutes (see `SETUP.md` section 5).

You can open and edit this file in two ways:
- **On GitHub's website**: find the file in your repository, click the pencil (edit) icon, make your change, and click "Commit changes" at the bottom. No installation needed, works from any computer.
- **On your own computer**: if you've set up the project locally (`SETUP.md` section 1), open the file in any plain text editor and run `pnpm dev` to preview your change at `localhost:3000` before it goes live.

Either way, save carefully — this is a code file, so punctuation matters (explained below).

**Before you change anything for real trading, read the allergen accuracy warning near the top of `SETUP.md`.** The allergen flags currently in this file have not been checked against your real recipes yet.

---

## A full annotated example

Here is one real product from the file — the Mango juice — with a note on every line:

```ts
{
  id: "mango",                    // A short, unique code for this product.
                                   // Lower-case, words joined with a hyphen.
                                   // Never reuse an id — the shopping basket
                                   // and past orders refer to products by id.

  name: "Mango",                  // The name shown to customers.

  tagline: "Seasonal fruit",      // A short line under the name on the
                                   // product card. Keep it brief.

  description:
    "Thick, sweet and only around while the fruit is good. When it is " +
    "on, it sells out.",
                                   // The longer description shown on the
                                   // product page.

  category: "juice",              // Must be one of: "juice", "fuel", or
                                   // "bake". This controls which section of
                                   // the menu the product appears in — see
                                   // "The three categories" below.

  price: 450,                     // The price IN PENCE. 450 means £4.50.
                                   // See "Why pence, not pounds" below —
                                   // get this wrong and you overcharge or
                                   // undercharge every customer.

  size: "330ml",                  // The serving size shown on the label.

  ingredients: ["Mango"],         // A plain list of what's in it, shown to
                                   // customers. List every real ingredient —
                                   // this is what people are buying.

  allergens: [],                  // The allergens this product contains.
                                   // Empty [] means none — but see the
                                   // allergen accuracy warning at the top of
                                   // SETUP.md before you trust that for a
                                   // single product on this menu.

  image: "mango.jpg",             // The filename of the product photo,
                                   // which must exist in /public/products/
                                   // with this EXACT name. See SETUP.md
                                   // section 8 for photo requirements.

  accent: "#F9B517",              // A colour, in hex code (a six-character
                                   // colour code like #F9B517, the kind any
                                   // online colour picker gives you). See
                                   // "The accent colours" below.

  accentDeep: "#DC7C04",          // A second, deeper colour that pairs with
                                   // accent. See "The accent colours" below.

  bestseller: true,               // Optional. Add this line to show a
                                   // "bestseller" badge. Leave it out
                                   // entirely for products without the badge.

  seasonal: true,                 // Optional. Add this line for a product
                                   // that isn't available all year round —
                                   // Mango is only in when the fruit is good.
                                   // Leave it out for anything always on the
                                   // menu.

  keepsDays: 3,                   // How many days this keeps in the fridge.
                                   // Shown to customers as an honesty note.
                                   // Must be accurate — see the shelf-life
                                   // warning in going-live-checklist.md.

  fruit: "mango",                 // Optional, juices only. Picks which fruit
                                   // garnish shows in the animated hero
                                   // graphic on the homepage. Use a plain,
                                   // lower-case word for the fruit, e.g.
                                   // "orange", "pineapple", "watermelon".
                                   // Leave it out for Fuel Cartel shakes and
                                   // Cartel Bakes — they don't use it.
},
```

Every product in the file follows this same shape. To see more real examples, scroll through the `products` array in `src/lib/catalogue.ts` — it currently holds seven Juice Cartel juices, four Fuel Cartel shakes and two Cartel Bakes.

---

## The three categories

Every product's `category` field must be exactly one of:

- `"juice"` — a Juice Cartel cold-pressed juice. Shows in the Juice Cartel section of the menu.
- `"fuel"` — a Fuel Cartel protein shake. Shows in the Fuel Cartel section.
- `"bake"` — a Cartel Bakes item. Shows in the Cartel Bakes section, and is the only category customers can add a topping to.

Type it exactly as shown, in lower case, inside the quote marks. Anything else will stop the site building.

---

## The accent colours

Every product has two colour fields, `accent` and `accentDeep`. Together they tint that product's artwork — the colour of the liquid in the bottle graphic and the soft glow behind its card on the menu — so a mango juice actually looks like mango, and a pomegranate juice looks deep red rather than generic orange.

- `accent` is the main colour.
- `accentDeep` is a deeper, darker shade of the same colour. Having two colours rather than one lets the artwork show a gradient (a smooth blend from lighter to darker) instead of a flat block of colour, which reads as more like real liquid.

Both are hex codes — six characters starting with `#`, like `#F9B517`. If you're not sure what hex code matches a colour in your head, search "hex colour picker", click roughly the shade you want, and copy the code it gives you. Pick a mid-tone for `accent` and a darker version of the same hue for `accentDeep`.

---

## The `seasonal` and `bestseller` flags

Both are optional and both work the same way: add the line to switch the badge on, leave the line out entirely to switch it off. Neither takes any value other than `true` — there's no `false`, you simply don't type the line.

- `bestseller: true` shows a "Bestseller" badge on the product card. Use it for the products that genuinely sell best — Classic Orange, Orange + Carrot, Mango, the Bueno shake and the Matilda Crunch Cake all currently carry it.
- `seasonal: true` shows the product as seasonal rather than a permanent fixture — currently only Mango. Use it for anything that isn't available all year.

A product can have both, neither, or just one.

---

## The `fruit` field

Only juices use this. It picks which fruit garnish appears in the animated hero graphic on the homepage — for example `fruit: "orange"` for Classic Orange, or `fruit: "watermelon"` for Watermelon. Use a plain, lower-case word for the fruit (or fruits) in the juice. Leave the line out completely for Fuel Cartel shakes and Cartel Bakes, since they don't appear in that graphic.

---

## Toppings

Cartel Bakes can take a topping for £1 extra. Toppings live in their own list in the same file, just below the `products` array:

```ts
export const toppings: Topping[] = [
  {
    id: "kinder-bueno",           // Same rules as a product id: short,
                                   // unique, lower-case, hyphenated.
    name: "Kinder Bueno",         // The name shown to customers.
    price: 100,                   // In pence. 100 means £1.00.
    allergens: ["milk", "nuts", "soya", "gluten"],
                                   // The allergens THIS TOPPING adds. See
                                   // below — this is separate from the
                                   // allergens of the bake it goes on.
  },
];
```

**To add a topping**, copy an existing block in the `toppings` array, give it a new `id` and `name`, set its `price` in pence, and list every allergen it genuinely contains.

**To remove a topping**, delete its whole block, from the opening `{` to the closing `},`.

**A topping changes the allergens of whatever it's added to.** The Matilda Crunch Cake, on its own, has no nuts in its `allergens` field. Add the Kinder Bueno topping, and the finished item does contain nuts, because Kinder Bueno does. A topping's `allergens` field is what that topping itself contains — it does not automatically add itself to the base product's `allergens` field, so when you're checking allergen accuracy (see `SETUP.md`), check every product-plus-topping combination a customer could actually order, not just the plain products.

---

## Why prices are in pence, not pounds

Every price in this file — for products, toppings and subscription boxes — is a whole number of **pence**. `450` means £4.50. `1200` means £12.00.

This is deliberate, and it matters:

- Computers can make small rounding errors with amounts like "£4.50" (fractions of a penny can creep in during calculations). Whole numbers of pence avoid that entirely.
- Stripe, the payment company this site uses, also works in pence internally — so keeping prices in pence here means the amount shown to a customer and the amount actually charged always match exactly.

**When you change a price, always convert pounds to pence by multiplying by 100.** £5.00 becomes `500`. £7.99 becomes `799`. If you accidentally type `5` instead of `500`, you will charge a customer 5 pence instead of £5 — always double check.

### How to change a price safely

1. Find the product's `price` line and change the number, in pence.
2. **Check whether that product appears in a subscription box.** Further down the same file, the `subscriptionTiers` array defines the three weekly boxes (The Reset, The Weekly, The Household). Each has its own `listPrice` — a hand-typed figure showing customers "what this would cost bought separately," which is what makes the box look like a saving. That figure is not calculated automatically from the individual product prices, so if you reprice a juice or a bake, work out the new total yourself and update the `listPrice` of any box that includes one, or the saving shown to customers will be wrong.
3. Save (or commit, if editing on GitHub). Check the live site once Vercel rebuilds, on both the product page and the subscription page, to confirm the new price and any subscription saving both look right.

---

## Allergens are not optional

The `allergens` field is not a nice-to-have — it's a legal requirement, and right now it is not confirmed against your real recipes. Read the warning near the top of `SETUP.md` before you rely on it for a single real order.

Under UK food law, allergen information for food sold at a distance (which includes anything ordered online for delivery) must be accurate and must reach the customer **both when they order and again with the delivery**. Getting this wrong can make someone seriously ill, and can also mean regulatory action against the business.

Rules for editing this field:

1. List **every** allergen the product actually contains, not just the obvious ones. Check every ingredient, including things like flavourings, spreads and pre-made mixes, which often contain milk, soya or gluten without it being obvious from the name.
2. The code tracks all **14 allergens named in UK law**, so there's never a reason to leave one off because "there's nowhere to put it":

   `celery`, `gluten` (cereals containing gluten — wheat, rye, barley and oats, treated as one legal category, which is why there's no separate "wheat"), `crustaceans`, `eggs`, `fish`, `lupin`, `milk`, `molluscs`, `mustard`, `nuts` (tree nuts), `peanuts`, `sesame`, `soya`, `sulphites`.

   Type the word exactly as shown, in lower case, inside quote marks — for example `allergens: ["milk", "gluten", "soya"]`.
3. When in doubt, ask whoever supplies your ingredients for their own allergen information, and check the packaging of anything pre-made (like Biscoff spread or Kinder Bueno) rather than guessing.
4. Remember toppings have their own allergens, on top of the base product's — see "Toppings" above.
5. Remember this information also needs to reach the customer again at the point of delivery (for example, on a label or note with the order) — the website showing it correctly is only half the legal requirement. See `docs/going-live-checklist.md`.
6. There's only one place to fix a wrong allergen: this file. The allergens page on the website and every product card on the menu both read straight from `src/lib/catalogue.ts`, so one correct edit here updates everywhere at once.

---

## Adding a new product

1. Open `src/lib/catalogue.ts`.
2. Find the `products` array (it starts with `export const products: Product[] = [`).
3. Copy an existing product's entire block, from the opening `{` to the closing `},`, and paste it either just before the closing `];` of the array, or anywhere between two other products.
4. Edit every field as described above. In particular:
   - Give it a new, unique `id`.
   - Set the `category` to `"juice"`, `"fuel"` or `"bake"`.
   - Set a `price` in pence.
   - List its real `ingredients` and `allergens`.
   - Choose an `image` filename, then make sure a photo with that exact filename is uploaded to `public/products/` (see `SETUP.md` section 8).
5. Save (or commit, if editing on GitHub). Check the live site after Vercel rebuilds to confirm the new product appears correctly, with a working photo (or the gold fallback, if the photo isn't ready yet) and the correct price.

## Editing or repricing an existing product

Find the product's block (search for its `name` or `id`) and change whichever fields need updating — most commonly `price`. Remember: pence, not pounds, and check the subscription boxes if the product appears in one (see "How to change a price safely" above). Save and the change goes live automatically.

## Removing a product

Delete the entire block for that product, from its opening `{` to its closing `},`, including everything in between. Be careful not to delete the comma or brace belonging to a neighbouring product. Save, and it disappears from the live menu after the next rebuild. You can leave its photo in `public/products/` — an unused photo does no harm — or delete it too, it's your choice.

---

## Subscription tiers

The three weekly subscription boxes (The Reset, The Weekly, The Household) work the same way, in the `subscriptionTiers` array further down the same file. Each has a `price` (in pence, per week — what the customer actually pays), a `listPrice` (in pence — what the same items would cost bought individually, used to show the saving, and typed in by hand rather than calculated), and an `includes` list of bullet points shown to customers. Edit these the same way as products — find the block, change the field, save. See "How to change a price safely" above for why `listPrice` needs checking whenever an included product's price changes.

---

## A note on breaking the file

This is a real code file — every product needs a matching comma, and every quote mark, brace `{}` and bracket `[]` needs its opposite. If you're not confident editing it directly, the safest approach is:

- Only ever change the value inside quotes or after a colon (for example, changing `450` to `500`, or changing text inside `"..."`).
- Don't remove or add braces `{}`, brackets `[]` or commas unless you're copying a complete block as described above.
- If the site fails to build after a change (Vercel will show a failed deployment), the most common cause is a missing comma or an unclosed quote — compare your edit carefully against a working product above or below it, or ask a developer to take a quick look.
