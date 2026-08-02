/**
 * Single source of truth for everything Juice Cartel sells.
 *
 * Products, names and prices are taken from the real menu card.
 * Prices are in pence to keep Stripe happy and avoid float drift.
 *
 * ALLERGENS: the flags below are a best-effort reading of each product from
 * its name and obvious ingredients. They have NOT been confirmed against the
 * actual recipes. Before taking a single real order, every line must be
 * checked against what genuinely goes in the bottle or tub — for food sold at
 * a distance the information has to reach the customer both at the point of
 * order and again with the delivery, and getting it wrong can seriously hurt
 * somebody. See docs/adding-products.md.
 */

/**
 * The 14 allergens named in UK law (Food Information Regulations 2014).
 * All 14 are trackable so a recipe change can always be declared accurately —
 * an allergen that cannot be recorded is an allergen that gets missed.
 *
 * Note "gluten" covers cereals containing gluten (wheat, rye, barley, oats)
 * as a single legal category, which is why there is no separate "wheat".
 */
export type Allergen =
  | "celery"
  | "gluten"
  | "crustaceans"
  | "eggs"
  | "fish"
  | "lupin"
  | "milk"
  | "molluscs"
  | "mustard"
  | "nuts"
  | "peanuts"
  | "sesame"
  | "soya"
  | "sulphites";

export type Category = "juice" | "fuel" | "bake";

export interface Product {
  id: string;
  name: string;
  /**
   * How the item is referred to inside a custom blend, where the full menu
   * name reads as a mouthful ("Classic Orange & Apple Blend"). Falls back to
   * `name`, so only the juices that need one carry it.
   */
  shortName?: string;
  tagline: string;
  description: string;
  category: Category;
  /** Price in pence. */
  price: number;
  /** Serve size shown on the label. */
  size: string;
  ingredients: string[];
  allergens: Allergen[];
  /** Filename inside /public/products. Swap for real photography. */
  image: string;
  /**
   * Drives the liquid colour of the vector bottle and the card glow.
   *
   * For the juices these are sampled pixels, not invented hexes: a lit
   * mid-tone and a shadowed deep tone read off the photographs in
   * `docs/reference/bottles/`, corrected for each frame's white point (the
   * wall in 01, the counter in 04 and 05, the sky in 03). Per-product notes
   * are on the lines below. Anything not photographed is set to sit in the
   * same family rather than guessed from the fruit.
   */
  accent: string;
  /** Second stop, so the liquid reads as a gradient rather than a flat fill. */
  accentDeep: string;
  bestseller?: boolean;
  seasonal?: boolean;
  /** Days the item keeps, refrigerated. */
  keepsDays: number;
  /** Fruit garnish used by the animated hero. */
  fruit?: string;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  allergens: Allergen[];
}

export interface SubscriptionTier {
  id: string;
  name: string;
  /** Weekly price in pence. */
  price: number;
  /** What the same contents would cost bought individually, in pence. */
  listPrice: number;
  contents: string;
  includes: string[];
  bestValue?: boolean;
  blurb: string;
}

export const DELIVERY = {
  city: "Nottingham",
  /** Free delivery at or above this basket value, in pence. */
  freeDeliveryThreshold: 2000,
  /** Flat delivery charge below the threshold, in pence. */
  deliveryFee: 250,
  /** Orders below this are not accepted — they lose money on fuel alone. */
  minimumOrder: 1200,
  /** Subscription drop day. One press, one route. */
  dropDay: "Sunday",
  /** Outward codes currently on the route. */
  postcodes: [
    "NG1", "NG2", "NG3", "NG4", "NG5",
    "NG6", "NG7", "NG8", "NG9", "NG11", "NG16",
  ],
} as const;

export const SOCIALS = {
  tiktok: "https://www.tiktok.com/@juicecartel.uk",
  instagram: "https://www.instagram.com/juicecartel.uk",
  snapchat: "https://www.snapchat.com/add/juicecartel.uk",
  handle: "@juicecartel.uk",
  phone: "07378811194",
} as const;

export const products: Product[] = [
  /* ---------------- Juice Cartel · 330ml · cold pressed ---------------- */
  {
    id: "classic-orange",
    name: "Classic Orange",
    shortName: "Orange",
    tagline: "The one that started it",
    description:
      "Whole oranges, cold pressed the morning they go out. Nothing added, nothing watered down.",
    category: "juice",
    price: 375,
    size: "330ml",
    ingredients: ["Orange"],
    allergens: [],
    image: "classic-orange.png",
    /* 01-three-bottles-straight-on: body mid-column #dc9e15, base #987704. */
    accent: "#EEAB16",
    accentDeep: "#A2790A",
    bestseller: true,
    keepsDays: 3,
    fruit: "orange",
  },
  {
    id: "apple",
    name: "Apple",
    tagline: "Crisp and clean",
    description:
      "Pressed apples, sharp and clear. The simplest thing on the menu and the hardest to get right.",
    category: "juice",
    price: 375,
    size: "330ml",
    ingredients: ["Apple"],
    allergens: [],
    image: "apple.png",
    /* Not photographed. Held green, pulled to the value the sampled juices sit at. */
    accent: "#C2D33A",
    accentDeep: "#7E9114",
    keepsDays: 3,
    fruit: "apple",
  },
  {
    id: "pineapple",
    name: "Pineapple",
    tagline: "Sharp, sweet, tropical",
    description:
      "Fresh pineapple pressed thick, with all the sweetness and none of the tin.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Pineapple"],
    allergens: [],
    image: "pineapple.png",
    /* Not photographed. A shade lighter and greener than the sampled orange. */
    accent: "#EFC81E",
    accentDeep: "#B98A08",
    keepsDays: 3,
    fruit: "pineapple",
  },
  {
    id: "orange-carrot",
    name: "Orange + Carrot",
    shortName: "Orange Carrot",
    tagline: "The morning fix",
    description:
      "Oranges and carrots pressed together. Bright, earthy and the best colour we make.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Orange", "Carrot"],
    allergens: [],
    image: "orange-carrot.png",
    /* 02-orange-carrot-held: lit body #c65906, shadowed left edge #aa3f11. */
    accent: "#DC630D",
    accentDeep: "#A83C0B",
    bestseller: true,
    keepsDays: 3,
    fruit: "carrot",
  },
  {
    id: "watermelon",
    name: "Watermelon",
    tagline: "Summer in a bottle",
    description:
      "Nothing but watermelon. Light enough to drink in one go on a hot day, which most people do.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Watermelon"],
    allergens: [],
    image: "watermelon.png",
    /* 05-watermelon-pour: #a72031 / #7e0315, white-balanced off the counter. */
    accent: "#E24358",
    accentDeep: "#9A1233",
    keepsDays: 3,
    fruit: "watermelon",
  },
  {
    id: "pomegranate",
    name: "Pomegranate",
    tagline: "The expensive one, and worth it",
    description:
      "It takes a lot of pomegranates to fill one bottle. That is the whole reason for the price.",
    category: "juice",
    price: 749,
    size: "330ml",
    ingredients: ["Pomegranate"],
    allergens: [],
    image: "pomegranate.png",
    /* 04-orange-pour-kitchen, but that bottle sits in deep shade — the frame
       only gives the depth, so the hue is held and the value pulled down. */
    accent: "#B4173C",
    accentDeep: "#6A0A22",
    keepsDays: 3,
    fruit: "pomegranate",
  },
  {
    id: "mango",
    name: "Mango",
    tagline: "Seasonal fruit",
    description:
      "Thick, sweet and only around while the fruit is good. When it is on, it sells out.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Mango"],
    allergens: [],
    image: "mango.png",
    /* 03-mango-sunset: transmitted edge #df7a2a, body #916644, sunset grade
       divided out against the near-white sky. */
    accent: "#EFA224",
    accentDeep: "#B96A0B",
    bestseller: true,
    seasonal: true,
    keepsDays: 3,
    fruit: "mango",
  },

  /* ---------------- Fuel Cartel · 35g+ protein ---------------- */
  {
    id: "fuel-bueno",
    name: "Bueno",
    tagline: "35g+ protein",
    description:
      "Kinder Bueno blended into a protein shake that tastes like it should not be good for you.",
    category: "fuel",
    price: 499,
    size: "35g+ protein",
    ingredients: [
      "Milk", "Whey protein", "Kinder Bueno", "Hazelnut", "Cocoa",
    ],
    allergens: ["milk", "nuts", "soya", "gluten"],
    image: "fuel-bueno.jpg",
    accent: "#C89A5B",
    accentDeep: "#8A5E24",
    bestseller: true,
    keepsDays: 2,
  },
  {
    id: "fuel-lotus",
    name: "Lotus",
    tagline: "35g+ protein",
    description:
      "Caramelised Biscoff through a full protein shake. Thick, spiced and heavy.",
    category: "fuel",
    price: 499,
    size: "35g+ protein",
    ingredients: ["Milk", "Whey protein", "Biscoff spread", "Biscoff biscuit"],
    allergens: ["milk", "gluten", "soya"],
    image: "fuel-lotus.jpg",
    accent: "#C6813C",
    accentDeep: "#8A4E14",
    keepsDays: 2,
  },
  {
    id: "fuel-mars",
    name: "Mars",
    tagline: "35g+ protein",
    description:
      "Chocolate and caramel blended with whey. The one people order after the gym.",
    category: "fuel",
    price: 499,
    size: "35g+ protein",
    ingredients: ["Milk", "Whey protein", "Mars bar", "Caramel", "Cocoa"],
    allergens: ["milk", "soya"],
    image: "fuel-mars.jpg",
    accent: "#9C6B3E",
    accentDeep: "#5E3612",
    keepsDays: 2,
  },
  {
    id: "fuel-ramadan-sheikh",
    name: "Ramadan Sheikh",
    tagline: "Back every Ramadan",
    description:
      "The Ramadan special. Rich, sweet and built for opening a fast properly.",
    category: "fuel",
    price: 399,
    size: "Single serve",
    ingredients: ["Milk", "Dates", "Sugar", "Cardamom"],
    allergens: ["milk"],
    image: "fuel-ramadan-sheikh.jpg",
    accent: "#B98A4E",
    accentDeep: "#6E4718",
    keepsDays: 2,
  },

  /* ---------------- Cartel Bakes ---------------- */
  {
    id: "bruce-matilda-cake",
    name: "Bruce Matilda Cake",
    tagline: "Deep chocolate sponge",
    description:
      "The chocolate cake the film made famous. Dense, dark and served cold.",
    category: "bake",
    price: 599,
    size: "Single tub",
    ingredients: [
      "Wheat flour", "Sugar", "Cocoa", "Egg", "Butter", "Milk",
    ],
    allergens: ["gluten", "eggs", "milk", "soya"],
    image: "bruce-matilda-cake.jpg",
    accent: "#8A5A2E",
    accentDeep: "#4A2A0C",
    keepsDays: 4,
  },
  {
    id: "matilda-crunch-cake",
    name: "Matilda Crunch Cake",
    tagline: "The Ramadan bestseller",
    description:
      "The one that broke our record month. Chocolate crunch base under a thick melted top.",
    category: "bake",
    price: 699,
    size: "Single tub",
    ingredients: [
      "Wheat biscuit", "Milk chocolate", "Butter", "Golden syrup", "Cocoa",
    ],
    allergens: ["gluten", "milk", "soya"],
    image: "matilda-crunch-cake.jpg",
    accent: "#A9702F",
    accentDeep: "#5C3410",
    bestseller: true,
    keepsDays: 5,
  },
];

/** Add-ons for Cartel Bakes, £1 each. */
export const toppings: Topping[] = [
  {
    id: "lotus-biscoff",
    name: "Lotus Biscoff",
    price: 100,
    allergens: ["gluten", "soya"],
  },
  {
    id: "mini-egg",
    name: "Mini Egg",
    price: 100,
    allergens: ["milk", "soya"],
  },
  {
    id: "kinder-bueno",
    name: "Kinder Bueno",
    price: 100,
    allergens: ["milk", "nuts", "soya", "gluten"],
  },
];

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "reset",
    name: "The Reset",
    price: 1150,
    listPrice: 1350,
    contents: "3 juices, every week",
    blurb:
      "Three bottles on your doorstep every Sunday. Enough to get you through the first half of the week without thinking about it.",
    includes: [
      "3 × 330ml juices, your pick",
      "Delivered every Sunday",
      "Swap flavours any week",
      "Cancel whenever you like",
    ],
  },
  {
    id: "weekly",
    name: "The Weekly",
    price: 1750,
    // 3 × £4.50 juice + £5.99 Bruce Matilda Cake
    listPrice: 1949,
    contents: "3 juices + 1 bake, every week",
    bestValue: true,
    blurb:
      "The one most people land on. Juices for the week and something for Sunday night.",
    includes: [
      "3 × 330ml juices, your pick",
      "1 × Cartel Bake, your pick",
      "Delivered every Sunday",
      "Free delivery, always",
      "First pick of new flavours",
    ],
  },
  {
    id: "household",
    name: "The Household",
    price: 3350,
    // 6 × £4.50 juice + 2 × £5.99 Bruce Matilda Cake
    listPrice: 3898,
    contents: "6 juices + 2 bakes, every week",
    blurb:
      "Built for two people, or one person who has stopped pretending. The best price per bottle we do.",
    includes: [
      "6 × 330ml juices, your pick",
      "2 × Cartel Bakes, your pick",
      "Delivered every Sunday",
      "Free delivery, always",
      "First pick of new flavours",
    ],
  },
];

/* ---------- helpers ---------- */

export const formatPrice = (pence: number): string =>
  `£${(pence / 100).toFixed(2).replace(/\.00$/, "")}`;

export const getProduct = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const getTier = (id: string): SubscriptionTier | undefined =>
  subscriptionTiers.find((t) => t.id === id);

export const getTopping = (id: string): Topping | undefined =>
  toppings.find((t) => t.id === id);

/** The seven juices, in the order the hero orbits them. */
export const juices = products.filter((p) => p.category === "juice");

/** Wording follows the legal category names, not casual shorthand. */
export const allergenLabel: Record<Allergen, string> = {
  celery: "Celery",
  gluten: "Cereals containing gluten",
  crustaceans: "Crustaceans",
  eggs: "Eggs",
  fish: "Fish",
  lupin: "Lupin",
  milk: "Milk",
  molluscs: "Molluscs",
  mustard: "Mustard",
  nuts: "Tree nuts",
  peanuts: "Peanuts",
  sesame: "Sesame",
  soya: "Soybeans",
  sulphites: "Sulphur dioxide / sulphites",
};

/** Stable display order for tables and badges. */
export const allergenOrder: Allergen[] = [
  "celery", "gluten", "crustaceans", "eggs", "fish", "lupin", "milk",
  "molluscs", "mustard", "nuts", "peanuts", "sesame", "soya", "sulphites",
];

export const categoryLabel: Record<Category, string> = {
  juice: "Juice Cartel",
  fuel: "Fuel Cartel",
  bake: "Cartel Bakes",
};

export const categoryNote: Record<Category, string> = {
  juice: "Cold pressed · 330ml",
  fuel: "35g+ protein",
  bake: "Toppings £1 extra",
};

/** Outward code check, e.g. "ng7 2rd" → true. */
export const isInDeliveryArea = (postcode: string): boolean => {
  const outward = postcode.trim().toUpperCase().split(/\s+/)[0];
  return (DELIVERY.postcodes as readonly string[]).includes(outward);
};
