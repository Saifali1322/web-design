import {
  DELIVERY,
  SOCIALS,
  formatPrice,
  getProduct,
  getTier,
  juices,
  products,
  subscriptionTiers,
} from "@/lib/catalogue";

/**
 * Every answer on this page is derived from the catalogue or from something
 * another page already states, so the FAQ can never quietly disagree with the
 * menu, the delivery page or the subscription page. Where two existing pages
 * word a rule slightly differently (the swap deadline, for instance) the
 * answer here is written to be true of both rather than picking a side.
 *
 * Answers are plain strings rather than JSX for one reason: the same text is
 * used for the FAQPage structured data in page.tsx, and a schema built from a
 * second, hand-kept copy of the wording would drift within a month. Anything
 * that needs to be a link goes in `links`, which renders as a row underneath.
 */

export interface FaqLink {
  label: string;
  href: string;
}

export interface FaqItem {
  q: string;
  /** One entry per paragraph. */
  a: string[];
  links?: FaqLink[];
}

export interface FaqGroup {
  /** Used as the anchor, so it is linked to from the homepage sections. */
  id: string;
  title: string;
  /** One line of orientation under the group heading. */
  note: string;
  items: FaqItem[];
}

/* ---------- figures read off the catalogue ---------- */

const keepsIn = (category: string) =>
  products.filter((p) => p.category === category).map((p) => p.keepsDays);

const JUICE_KEEPS = Math.min(...keepsIn("juice"));
const FUEL_KEEPS = Math.min(...keepsIn("fuel"));
const BAKE_MIN = Math.min(...keepsIn("bake"));
const BAKE_MAX = Math.max(...keepsIn("bake"));

const SINGLE_INGREDIENT = juices.filter(
  (juice) => juice.ingredients.length === 1,
).length;

/** The dearest juice makes the price argument better than any adjective. */
const DEAREST = juices.reduce((a, b) => (b.price > a.price ? b : a));

const POMEGRANATE = getProduct("pomegranate") ?? DEAREST;

const WEEKLY = getTier("weekly") ?? subscriptionTiers[0];
const BEST_SAVING = subscriptionTiers.reduce((best, tier) =>
  tier.listPrice - tier.price > best.listPrice - best.price ? tier : best,
);

const bakeKeeps =
  BAKE_MIN === BAKE_MAX ? `${BAKE_MIN} days` : `${BAKE_MIN} to ${BAKE_MAX} days`;

const postcodeList = DELIVERY.postcodes.join(", ");

/* ---------- the questions ---------- */

export const faqGroups: FaqGroup[] = [
  {
    id: "juice",
    title: "The juice itself",
    note: "What is in it, how it behaves and how long you have.",
    items: [
      {
        q: "Is it pasteurised?",
        a: [
          "No. Nothing is heated and nothing is put under high pressure. Fruit goes through the press, juice goes into the bottle, and that is the entire process.",
          `It is why it tastes the way it does and why it only has ${JUICE_KEEPS} days on it. Juice that keeps for a month has had something done to it to get there.`,
        ],
        links: [{ label: "Why it is made this way", href: "/about" }],
      },
      {
        q: "How long does it keep?",
        a: [
          `Juices keep ${JUICE_KEEPS} days refrigerated. The protein shakes keep ${FUEL_KEEPS}. The bakes keep ${bakeKeeps}.`,
          `Every item shows its own figure on its card, and the number is the shortest honest one rather than the most convenient. The clock starts the morning it is made, which for a ${DELIVERY.dropDay} delivery is the same day it reaches you.`,
        ],
        links: [{ label: "Every item, with its date", href: "/menu" }],
      },
      {
        q: "Why does it have to stay cold?",
        a: [
          "Because there is nothing in it holding it stable at room temperature. Raw juice with no preservative and no heat treatment depends entirely on staying cold.",
          "It leaves here in a cool bag with ice packs. Put it in the fridge as soon as it arrives and keep it there. A bottle that has spent a warm afternoon in a car or on a desk should not be drunk later, and if something ever reaches you warm, message us the same day — we would rather know.",
        ],
      },
      {
        q: "It has separated in the bottle. Is it off?",
        a: [
          "Almost certainly not. Fresh juice separates: the pulp settles and a paler foam sits on top. It is visible in every photograph of the bottles on this site. Shake it and it comes back together.",
          "What you are actually looking for is a bottle that has swollen, fizzes on opening, or smells of vinegar or alcohol. That one goes in the bin, and tell us about it.",
        ],
      },
      {
        q: "Is there any added sugar, water or preservative?",
        a: [
          `None of the three. ${SINGLE_INGREDIENT} of the ${juices.length} juices have exactly one ingredient on the list, and the others are just more fruit.`,
          "No concentrate, no syrup, no stabiliser, nothing to stop the colour going. The full ingredient list for every item is written out on the menu rather than summarised.",
        ],
        links: [{ label: "Read the ingredients", href: "/menu" }],
      },
      {
        q: "Why does it cost more than a supermarket bottle?",
        a: [
          `Because ${juices[0].size} of juice takes several times its own volume in fruit, and there is nothing cheap in the bottle making up the difference.`,
          `${POMEGRANATE.name} is the clearest case: ${formatPrice(POMEGRANATE.price)}, because it takes a lot of pomegranates to fill one bottle and there is no second answer to that. On top of the fruit, it is pressed in small batches against a list rather than by the thousand, and delivered by the person who made it.`,
        ],
      },
      {
        q: "Can I freeze it?",
        a: [
          "You can, but it will not be the same drink. Freeze it the day it arrives, defrost it in the fridge overnight and drink it that day. It will separate more than usual, so shake it hard. Do not refreeze it.",
        ],
      },
      {
        q: "Is any of it vegan?",
        a: [
          `All ${juices.length} juices — they are fruit and nothing else.`,
          "Nothing in Fuel Cartel is: every shake is built on milk and whey protein. The bakes contain butter, milk and egg.",
        ],
        links: [{ label: "Full allergen table", href: "/allergens" }],
      },
    ],
  },

  {
    id: "ordering",
    title: "Ordering",
    note: "Deadlines, minimums and what happens after you pay.",
    items: [
      {
        q: "What is the minimum order?",
        a: [
          `${formatPrice(DELIVERY.minimumOrder)}. Below that a delivery run loses money on fuel before anything else has been counted, so we cannot take it.`,
          "There is no minimum on collection.",
        ],
        links: [{ label: "Delivery rules in full", href: "/delivery" }],
      },
      {
        q: "What does delivery cost?",
        a: [
          `Nothing over ${formatPrice(DELIVERY.freeDeliveryThreshold)}. Under that it is a flat ${formatPrice(DELIVERY.deliveryFee)}, whatever is in the bag.`,
          "Every weekly subscription includes delivery, every week, whatever size it is.",
        ],
        links: [{ label: "The weekly drop", href: "/subscribe" }],
      },
      {
        q: "When do I need to order by?",
        a: [
          `Thursday night for that ${DELIVERY.dropDay}. The press list closes then and the fruit is bought against it afterwards.`,
          "Anything that lands after Thursday goes on the following week. That is the only reason nothing is ever pressed on spec.",
        ],
      },
      {
        q: "Can I change or cancel an order after I have placed it?",
        a: [
          "Up to Thursday night, yes — message us and it is changed, at no charge.",
          "After Thursday the fruit for your box has already been bought against your order, so get in touch as early as you can and we will work out what is possible.",
        ],
      },
      {
        q: "How do I pay?",
        a: [
          "By card at the checkout, handled by Stripe. Card details never touch this site, and Stripe emails you a receipt within a minute or two of paying.",
        ],
      },
    ],
  },

  {
    id: "delivery",
    title: "Delivery",
    note: `${DELIVERY.postcodes.length} outward codes, one route, every ${DELIVERY.dropDay}.`,
    items: [
      {
        q: "Where do you deliver?",
        a: [
          `${DELIVERY.postcodes.length} outward codes across ${DELIVERY.city}: ${postcodeList}.`,
          "If yours is not on that list we cannot reach you yet, and the site will say so before you pay rather than after.",
        ],
        links: [{ label: "Check your postcode", href: "/delivery" }],
      },
      {
        q: `What time on ${DELIVERY.dropDay}?`,
        a: [
          "Afternoon, in one run. The order the route goes in changes week to week depending on what is in it, so instead of promising a slot we message you before setting off with a rough time.",
        ],
      },
      {
        q: "What happens if nobody is in?",
        a: [
          "Tell us in advance where it can go — a porch, a neighbour, behind a gate — and it is left there in the cool bag.",
          `If we have not been told anything, we ring, knock and call your number. If there is still no answer the box comes back with us and we message you the same afternoon. Raw juice is not something to leave sitting on a doorstep in the sun, so we will not do it.`,
        ],
      },
      {
        q: "Can I collect instead?",
        a: [
          `Yes. Message us before ${DELIVERY.dropDay} and we will arrange a time and a place near the kitchen. No minimum order applies to collections.`,
        ],
        links: [{ label: "Arrange collection", href: "/delivery" }],
      },
      {
        q: `Do you post outside ${DELIVERY.city}?`,
        a: [
          "No, and we are not planning to. A courier cannot keep a bottle properly cold for a day and a half, and warm raw juice is not something to put in the post.",
          "When the route grows it will grow by adding streets, not by adding a carrier.",
        ],
      },
      {
        q: "My postcode is not on the list.",
        a: [
          "Message us anyway — it goes on the list of places we are trying to reach. A second zone only opens once the first one is genuinely full, because a missed delivery costs more than a new customer is worth.",
          "In the meantime, collection is open to anybody.",
        ],
      },
    ],
  },

  {
    id: "subscription",
    title: "The weekly drop",
    note: "Swapping, skipping, cancelling and where the saving comes from.",
    items: [
      {
        q: "Is the subscription actually cheaper?",
        a: [
          `Yes, and the arithmetic is on the page. ${WEEKLY.name} is ${formatPrice(WEEKLY.price)} for ${WEEKLY.contents.toLowerCase()}; the same items bought one at a time off the menu come to ${formatPrice(WEEKLY.listPrice)}. ${BEST_SAVING.name} saves ${formatPrice(BEST_SAVING.listPrice - BEST_SAVING.price)} a week.`,
          `The struck-through figures are menu prices, not an invented list price. Delivery is free on every tier as well, which on a small box is another ${formatPrice(DELIVERY.deliveryFee)}.`,
          "The saving is not a discount being absorbed. Knowing the exact number of bottles before the fruit is bought means nothing is pressed on spec and nothing is thrown away, so the box costs less to make.",
        ],
        links: [{ label: "See the tiers", href: "/subscribe" }],
      },
      {
        q: "Can I skip a week?",
        a: [
          `Yes. Message us before that ${DELIVERY.dropDay}'s drop and it is paused; it picks straight back up the week after and nothing is lost.`,
          "Earlier is better — once Thursday has gone the fruit has been bought — but tell us any time before we set off and we will hold it.",
        ],
      },
      {
        q: "Can I change flavours?",
        a: [
          "Any week, at no extra charge. Message us with what you would rather have and it is swapped on the press list.",
          "Before Thursday is best, because that is when the list closes and the fruit is bought against it.",
        ],
      },
      {
        q: "How do I cancel?",
        a: [
          "Whenever you like. No minimum term, no notice period, no cancellation fee.",
          "Message us, or use the link in your confirmation email, and it stops before the next payment is taken.",
        ],
      },
      {
        q: "When is payment taken?",
        a: [
          `Automatically, once a week, on the card you subscribed with, ahead of the ${DELIVERY.dropDay} run. Stripe emails a receipt every time.`,
        ],
      },
    ],
  },

  {
    id: "allergens",
    title: "Allergens and safety",
    note: "The part of the site we would rather over-explain than under-explain.",
    items: [
      {
        q: "What is your allergen policy?",
        a: [
          "Every item lists what it contains, and there is a full table covering all fourteen allergens named in UK law.",
          "That table is a best-effort reading of each recipe and has not yet been checked line by line against what actually goes in the bottle — which the allergen page states plainly at the top rather than in a footnote. If you have an allergy or intolerance of any kind, call or message before ordering. Every time, not just the first time.",
        ],
        links: [
          { label: "Full allergen matrix", href: "/allergens" },
          { label: `Call ${SOCIALS.phone}`, href: `tel:${SOCIALS.phone}` },
        ],
      },
      {
        q: "Is everything made in the same kitchen?",
        a: [
          "Yes. One kitchen, which also handles milk, wheat, soya and nuts, on shared equipment and shared surfaces.",
          "We clean thoroughly between batches, but we cannot promise total separation, so nothing here is labelled free from anything.",
        ],
        links: [{ label: "Cross-contamination, in full", href: "/allergens" }],
      },
      {
        q: "Is unpasteurised juice safe for everyone?",
        a: [
          "For most people, yes. But nothing has been done to it to kill bacteria that may be on the fruit, and that matters more for some people than others.",
          "Standard UK food safety advice is that anyone pregnant, very young, over 65, or whose immune system is not working normally should avoid unpasteurised drinks. We would far rather say that here than have you find it out afterwards.",
          "If you are unsure, ask a pharmacist, GP or midwife — and ask us anything you like about how it is made.",
        ],
      },
    ],
  },

  {
    id: "us",
    title: "Us",
    note: "Who is on the other end of it.",
    items: [
      {
        q: "Who actually makes this?",
        a: [
          `One person, in a home kitchen in ${DELIVERY.city}, who also loads the cool bag, drives the route and answers the phone.`,
        ],
        links: [{ label: "The whole story", href: "/about" }],
      },
      {
        q: "Is there a shop?",
        a: [
          `No — there is nowhere to walk into. Everything goes out on the ${DELIVERY.dropDay} route, or by collection arranged in advance.`,
        ],
      },
      {
        q: "How do I get hold of you?",
        a: [
          "By phone, or by message on Instagram, TikTok or Snapchat. It is the same person on all of them, and there is no queue and no ticket number.",
        ],
      },
    ],
  },
];
