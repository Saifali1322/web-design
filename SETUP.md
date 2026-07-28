# Juice Cartel — setup guide

This is the complete guide to getting the Juice Cartel website running, taking real payments, and live on the internet at juicecartel.uk. It is written for you, the owner — no coding or web experience assumed.

Work through it in order. Each stage builds on the last.

**Rough timeline:** you could have the site running on your own laptop in half an hour. Stripe approval takes a day or two. The full journey to a live, working, paid-for domain usually takes about a week, mostly spent waiting on Stripe and DNS (explained below), not doing active work.

Anywhere you see **£** or **COSTS MONEY**, that step has a real cost attached. Anywhere you see **LEGAL**, that step is a legal requirement, not optional polish — see `docs/going-live-checklist.md` for the full list.

---

## Before anything else: the allergen information is not confirmed yet

**Read this section before you read anything else in this guide.**

The menu was recently replaced with your real products, in the file `src/lib/catalogue.ts`. Every product in that file has an `allergens` field, but those flags were worked out by reading each product's name and thinking about what a recipe like that would typically contain. Nobody has checked them against your actual recipes. They are a starting point, not a fact, and they must not be trusted as they stand.

Before you take a single real order:

1. Go through every product and check its `allergens` field against exactly what goes into it in your kitchen — the real ingredients you actually use, not what the product name suggests.
2. Remember a topping changes a product's allergens. The Matilda Crunch Cake has no nuts in it on its own. Add the Kinder Bueno topping and it does, because Kinder Bueno contains tree nuts. If a customer can add a topping, the allergens for that combination need to be right too.
3. By law, allergen information for food sold at a distance (which includes anything ordered online for delivery) must reach the customer **twice**: once when they order, on the website, and again with the delivery itself, for example on a label or slip attached to the order. Getting the website right is only half the job.

**Where to fix it:** open `src/lib/catalogue.ts` and find the product. Each one has a line that reads `allergens: [...]` — list every allergen that product genuinely contains inside those square brackets. Toppings, further down the same file, each have their own `allergens: [...]` line too. There is only one place to edit this. The allergens page on the website and every product card on the menu both read from this same file, so one correct edit updates everywhere at once. Full instructions, including the complete list of allergen names the code understands, are in `docs/adding-products.md`.

Do not skip this. Getting allergen information wrong can make someone seriously ill, and it is also the law to get it right.

---

## What this site is

This is the Juice Cartel ordering website: a page where customers in Nottingham browse the Juice Cartel cold-pressed juices, Fuel Cartel protein shakes and Cartel Bakes, add them to a basket, and pay by card. It also sells weekly subscriptions (a mix of juices and bakes delivered every Sunday, paid for automatically each week).

Under the bonnet it's built with Next.js (the software that draws the pages) and Stripe (the company that handles card payments so you never touch anyone's card details directly).

The product list, prices, ingredients and allergens all live in one file: `src/lib/catalogue.ts`. How to edit that is covered in `docs/adding-products.md` — this guide is about getting the site running and taking money.

---

## 1. Running it on your own computer

Do this first. It lets you see and test the site before anyone else does, and before you spend any money.

### 1.1 Install Node.js

Node.js is the free program that lets your computer run the website's code.

1. Go to [nodejs.org](https://nodejs.org).
2. Download the version marked **LTS** (this means "Long Term Support" — the stable, recommended version). Do not pick the "Current" version.
3. Run the installer you downloaded and click through it with the default options.
4. To check it worked, open a **terminal**. A terminal is a plain black or white window where you type commands instead of clicking things:
   - On Windows, click the Start menu, type `cmd`, and open **Command Prompt**.
   - On a Mac, press Cmd+Space, type `terminal`, and open **Terminal**.
5. Type `node -v` and press Enter. If you see a version number like `v20.x.x`, it worked.

### 1.2 Install pnpm

This project uses **pnpm** instead of the more common `npm` to install its dependencies (the pre-written bits of code the site relies on). It works the same way, just faster.

In the same terminal, type:

```
npm install -g pnpm
```

Press Enter and wait for it to finish (a minute or so).

### 1.3 Get the project folder and install dependencies

1. In the terminal, navigate into the project folder. If it's on your Desktop, for example, type `cd Desktop/web-design` (replace with wherever the folder actually is) and press Enter.
2. Type:

```
pnpm install
```

3. Press Enter. This downloads everything the site needs to run. It can take a few minutes the first time — you'll see a lot of text scroll past, which is normal.

### 1.4 Start the site

Type:

```
pnpm dev
```

Press Enter. After a few seconds you'll see a message saying the site is ready, with an address like `http://localhost:3000`.

Open your web browser and go to **[http://localhost:3000](http://localhost:3000)**. You should see the Juice Cartel site. This copy only runs on your computer — nobody else can see it yet.

To stop it, click back in the terminal and press Ctrl+C. To start it again later, just run `pnpm dev` from inside the project folder again.

---

## 2. Creating a Stripe account

Stripe is the company that will actually process card payments for you and move the money into your bank account. You need an approved Stripe account before the site can take real payments.

**Do this early** — approval is not instant.

1. Go to [stripe.com](https://stripe.com) and click to sign up. Use a proper business email address if you have one.
2. Stripe will ask for your business details, including:
   - Your business name and what it sells (food and drink — describe it as a cold-pressed juice, protein shake and cake delivery business).
   - Your business address (this can be your home address if you run it from home).
   - Your date of birth and a form of photo ID (passport or driving licence) — this is standard for anyone taking online payments and stops the platform being used for fraud.
   - Your **bank account details** — this is the account Stripe pays your takings into. Have your sort code and account number ready.
3. Stripe will verify your identity and business details. **This routinely takes a day or two**, sometimes longer if they need more information. You'll get an email when it's approved. You can carry on with the rest of this guide while you wait — everything up to "switching to live mode" works fine before approval comes through.
4. Until you're approved, Stripe gives you a **test mode** account automatically (explained next), so you can build and test everything without waiting.

There's no cost to create a Stripe account. Stripe takes a small percentage plus a small fixed fee from each payment (currently around 1.5% + 20p for UK cards — check Stripe's own pricing page for the exact current figure) — this comes out automatically before the rest of the money reaches your bank account, so you never get billed separately for it.

---

## 3. Finding your API keys in Stripe

An **API key** is a long, secret code that proves to Stripe "this request is really coming from the Juice Cartel website." The site needs two of these to work: a secret key it uses on the server, and a webhook signing secret (covered in section 6).

### Test keys vs live keys — read this carefully

Every Stripe account has **two parallel sets of keys**:

- **Test keys** (they start with `sk_test_...`) — use these while building and checking the site works. Any card payment made with a test key is fake. Stripe gives you special test card numbers (like `4242 4242 4242 4242`) that always "succeed" without touching a real bank account. **No real money moves when you use test keys**, even if you type in a real card number.
- **Live keys** (they start with `sk_live_...`) — use these only once you are ready to actually charge real customers real money. Every payment made with a live key is real: real money leaves the customer's card and (minus Stripe's fee) lands in your bank account.

Stripe has a switch in the dashboard (usually labelled something like "Test mode") that flips which set of keys and data you're looking at. Always check which mode you're in before copying a key — pasting a live key into a site you're still testing risks real customers being charged for test orders, and pasting a test key into the finished live site means nobody can pay you.

### Where to find them

1. Log into Stripe and look for a section called **Developers** (Stripe reorganises its menus occasionally, so if it's not exactly there, look for "API keys" in the sidebar or search).
2. Inside, find **API keys**. You'll see a **Publishable key** and a **Secret key**.
3. This project only needs the **Secret key** (the one starting `sk_test_` or `sk_live_`). Click "Reveal" or similar to see the full value, and copy it somewhere safe temporarily (a plain notes file, not anywhere public).
4. Treat the secret key like a password. Never post it publicly, paste it into a chat, or commit it to GitHub. Anyone with it can move money through your account.

You'll paste this into Vercel in section 5.

---

## 4. Getting the code onto GitHub

GitHub is a website that stores your project's code and is what Vercel (the next section) connects to in order to publish the site. If the code isn't on GitHub yet, ask your developer to push it there for you, or follow GitHub's own "create a repository" instructions — this is a one-off setup step you'll only do once.

Once the code is on GitHub, you can even make small text edits (like changing a price) straight from the GitHub website later, without installing anything — see `docs/adding-products.md`.

---

## 5. Deploying to Vercel (free)

Vercel is the company that will host the live site — it takes the code from GitHub and turns it into a real, working website with a public web address. The free plan is enough for this project.

1. Go to [vercel.com](https://vercel.com) and sign up. Choose the option to **sign up with GitHub** — this links the two accounts and is the easiest route.
2. Once logged in, click to create a **New Project**.
3. Vercel will show a list of your GitHub repositories (projects). Find the Juice Cartel project and click **Import**.
4. Vercel will detect it's a Next.js project automatically and suggest sensible build settings. You shouldn't need to change anything here.
5. Before you click deploy, add the **environment variables**.

### What are environment variables?

Environment variables are secret settings — like your Stripe secret key — that the site needs to work, but which must never be written directly into the code (because the code is visible on GitHub, and secrets in there would be public). Instead, you type them once into Vercel, and Vercel makes them available to the running site securely.

On the Vercel import screen (and later, any time, under your project's **Settings → Environment Variables**), there's a form with two boxes per row: a **Name** and a **Value**. Add each of the following as its own row:

| Name (type exactly as shown) | Value | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | your Stripe secret key | Section 3 above. Use the `sk_test_...` key first; swap to `sk_live_...` only when going live (section covered in the checklist) |
| `STRIPE_WEBHOOK_SECRET` | your webhook signing secret | Section 6 below — you'll come back and fill this in after creating the webhook |
| `NEXT_PUBLIC_SITE_URL` | `https://juicecartel.uk` | This is just your live domain, once you have it pointed at Vercel (section 7). Until then you can leave it out or set it to the temporary Vercel address |

Check the file named `.env.example` in the project folder — it lists the exact, up-to-date set of variable names the site expects. Copy the names from there character-for-character (including capital letters and underscores); a typo in the name means the site won't find the value.

6. Click **Deploy**. Vercel will build the site — this takes a minute or two — and give you a working web address ending in `.vercel.app`. Open it to check the site loads.

From now on, every time new code is pushed to GitHub (whether by a developer or by you editing a file on GitHub's website), Vercel automatically rebuilds and republishes the site within a minute or two. You don't need to repeat this deployment step.

**Cost:** Vercel's free "Hobby" plan is enough for this site. There is nothing to pay here unless the business grows enough to need Vercel's paid tier, which is unlikely at this scale.

---

## 6. Setting up the Stripe webhook

A webhook is Stripe's way of tapping the website on the shoulder the moment a payment succeeds, so the order can be recorded and confirmed even if the customer closes their browser tab straight after paying.

1. In Stripe, find the **Webhooks** section (usually under Developers).
2. Add a new webhook endpoint, entering this exact address:

```
https://juicecartel.uk/api/webhook
```

3. You'll be asked which **events** to send. Select at minimum:
   - `checkout.session.completed` — fires the moment a customer finishes paying.
   
   If subscriptions are in use, also add:
   - `invoice.paid` — fires each time a weekly subscription payment is taken.
   - `customer.subscription.deleted` — fires when a customer cancels.

   If you're not sure which events exist under those exact names in your Stripe account (Stripe adds and renames events occasionally), search for "checkout" and "subscription" in the event picker and select the ones that most closely match the descriptions above.

4. Once created, Stripe shows a **signing secret** for that specific webhook (it starts with `whsec_...`). This is different from your API secret key — it proves that a request claiming to be from Stripe genuinely is.
5. Copy it and paste it into Vercel as the `STRIPE_WEBHOOK_SECRET` environment variable (section 5 above), then redeploy (Vercel usually offers a "Redeploy" button, or you can trigger it by pushing any small change to GitHub).

Remember: you need to create **two separate webhooks** eventually — one in test mode (for testing) and one in live mode (for real trading), because Stripe's test and live data don't mix. Each has its own signing secret.

---

## 7. Pointing juicecartel.uk at Vercel

This links your domain name (juicecartel.uk) to the site now running on Vercel, so customers can visit the real address instead of the `.vercel.app` one.

1. In your Vercel project, go to **Settings → Domains**.
2. Type in `juicecartel.uk` and add it.
3. Vercel will show you one or more **DNS records** to set — typically an `A` record (a set of numbers, Vercel will show the exact value) and/or a `CNAME` record (a piece of text pointing to Vercel). DNS records are the instructions that tell the internet "when someone types juicecartel.uk, send them here."
4. Log into wherever you originally bought the juicecartel.uk domain (your **registrar** — for example 123-reg, GoDaddy, Namecheap, or similar). Find the section usually called **DNS settings**, **DNS management**, or **Manage DNS**.
5. Add the records exactly as Vercel showed them — same type (A or CNAME), same value. Don't guess; copy them character-for-character from the Vercel screen.
6. Save. DNS changes can take anywhere from a few minutes to 24–48 hours to fully take effect everywhere on the internet, though it's often much faster. Vercel will show a green tick or "Valid Configuration" once it detects the domain is correctly pointed at it.

Once this is done, `https://juicecartel.uk` will show your live site, with a padlock icon in the browser meaning the connection is secure (Vercel sets this up automatically — no extra step needed).

---

## 8. Adding product photos

Photos live in the `public/products` folder inside the project. The website looks for an **exact filename** for each product, taken from the `image` line for that product in `src/lib/catalogue.ts` — if the filename doesn't match exactly (including the `.jpg`), the photo won't show.

**Required filenames** (case-sensitive — keep them all lower-case exactly as below; this list is taken straight from `src/lib/catalogue.ts`, so if the menu changes again, check that file rather than this list):

```
public/products/classic-orange.jpg
public/products/apple.jpg
public/products/pineapple.jpg
public/products/orange-carrot.jpg
public/products/watermelon.jpg
public/products/pomegranate.jpg
public/products/mango.jpg
public/products/fuel-bueno.jpg
public/products/fuel-lotus.jpg
public/products/fuel-mars.jpg
public/products/fuel-ramadan-sheikh.jpg
public/products/bruce-matilda-cake.jpg
public/products/matilda-crunch-cake.jpg
```

If you add a new product later, you set its filename yourself when you add it to the catalogue — see `docs/adding-products.md`.

**What happens if a photo is missing:** the site doesn't break or show a broken-image icon. Each product slot has a designed gold-and-black fallback built in — a warm gradient with a faint bottle outline, tinted with that product's own accent colour — so an empty slot still looks intentional and on-brand. The moment a correctly-named photo is uploaded, it fades in over the top automatically. So there's no rush and no risk in launching before every photo is ready.

**Recommended photo specs:**
- Square images, roughly **1200 × 1200 pixels**, so they look sharp on phones.
- File format: `.jpg`.
- Keep each file **under about 400KB**. A phone photo straight from the camera is often several MB, which slows the site down — use a free online image compressor (search "compress jpg online") to shrink it before uploading, or ask whoever edits your photos to export at a web-friendly size.
- Good, consistent lighting matters more than a fancy camera — natural daylight against a plain background works well for food photography.

To upload: copy the files into the `public/products` folder on your computer if you're running the site locally (section 1), or use GitHub's website to upload files directly into that folder in the repository — either way, once the files reach GitHub's `main` branch, Vercel republishes the live site automatically with the new photos within a couple of minutes. There's no separate rebuild step to remember — a push to `main` is the trigger, every time.

---

## 9. Testing a real order end to end before going live

Do this before telling any customer the site is open. It confirms the entire chain — browsing, payment, and webhook — actually works.

1. Make sure Vercel has your **test** Stripe key (`sk_test_...`) and the **test mode** webhook secret set (section 6).
2. Visit your live site address and add a product to the basket.
3. Go through checkout using one of Stripe's official test card numbers, for example `4242 4242 4242 4242`, any future expiry date, any 3-digit security code, and any postcode. This card always succeeds and **takes no real money** — that's the whole point of test mode.
4. Confirm you're taken to an order confirmation, and check the order appears in your Stripe dashboard (still in test mode) under **Payments**.
5. Once you're confident it all works, and once Stripe has approved your account for live payments, follow the steps in `docs/going-live-checklist.md` to switch everything from test to live mode.
6. After switching to live, do **one final real test**: place a genuine small order using your own real card, on your phone, on the actual juicecartel.uk address. Confirm the payment appears in Stripe's live dashboard and the money is on its way to your bank account. This is the only way to be certain real customers can actually pay you. You can refund yourself afterwards from the Stripe dashboard if you don't want to keep the product.

Only once that real test order has worked should you start taking orders from customers.
