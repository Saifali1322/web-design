/**
 * Single source of truth for everything Juice Cartel sells.
 *
 * Prices are in pence to keep Stripe happy and avoid float drift.
 * Allergens are a legal requirement, not a nice-to-have: for food sold at
 * distance the information must reach the customer both at the point of
 * order and again with the delivery, so every item carries a full list.
 */

export type Allergen =
  | "milk"
  | "eggs"
  | "wheat"
  | "gluten"
  | "soya"
  | "nuts"
  | "peanuts"
  | "sesame";

export type Category = "juice" | "shake" | "dessert" | "shot";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  /** Price in pence. */
  price: number;
  /** Serve size shown on the label, e.g. "330ml". */
  size: string;
  ingredients: string[];
  allergens: Allergen[];
  /** Filename inside /public/products. Swap for real photography. */
  image: string;
  /** Hex used for the card glow so each item reads as itself. */
  accent: string;
  bestseller?: boolean;
  /** Days the item keeps, refrigerated. Drives the honesty note on the card. */
  keepsDays: number;
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
} as const;

export const products: Product[] = [
  {
    id: "mango-juice",
    name: "Mango",
    tagline: "The one that sells out",
    description:
      "Alphonso mango pressed thick and cold. No water, no concentrate, no sugar added — it pours like a smoothie and drinks like dessert.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Mango", "Orange", "Lime"],
    allergens: [],
    image: "mango-juice.jpg",
    accent: "#F2A81D",
    bestseller: true,
    keepsDays: 3,
  },
  {
    id: "orange-juice",
    name: "Orange",
    tagline: "Pressed this morning",
    description:
      "Whole oranges, pressed the morning they go out. The pulp stays in — that's the point.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Orange"],
    allergens: [],
    image: "orange-juice.jpg",
    accent: "#F08519",
    keepsDays: 3,
  },
  {
    id: "watermelon-juice",
    name: "Watermelon Crush",
    tagline: "Summer in a bottle",
    description:
      "Watermelon, lime and a little mint. Light enough to drink in one go on a hot day, which most people do.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Watermelon", "Lime", "Mint"],
    allergens: [],
    image: "watermelon-juice.jpg",
    accent: "#E23557",
    keepsDays: 3,
  },
  {
    id: "carrot-juice",
    name: "Carrot & Ginger",
    tagline: "The morning fix",
    description:
      "Carrot, apple and enough fresh ginger to wake you up properly. Turmeric and black pepper in the back.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: [
      "Carrot", "Apple", "Ginger", "Turmeric", "Lemon", "Black pepper",
    ],
    allergens: [],
    image: "carrot-juice.jpg",
    accent: "#E2701B",
    keepsDays: 3,
  },
  {
    id: "berry-juice",
    name: "Berry Reset",
    tagline: "Deep and dark",
    description:
      "Mixed berries, beetroot and apple. Earthy, sharp and the colour of a good sunset.",
    category: "juice",
    price: 450,
    size: "330ml",
    ingredients: ["Strawberry", "Blueberry", "Beetroot", "Apple", "Lemon"],
    allergens: [],
    image: "berry-juice.jpg",
    accent: "#9B1B47",
    keepsDays: 3,
  },
  {
    id: "ginger-shot",
    name: "Ginger Shot",
    tagline: "Two seconds of regret",
    description:
      "Raw ginger, lemon, cayenne and honey. Unpleasant on purpose. Add one to any order.",
    category: "shot",
    price: 250,
    size: "60ml",
    ingredients: ["Ginger", "Lemon", "Cayenne", "Honey"],
    allergens: [],
    image: "ginger-shot.jpg",
    accent: "#D9A521",
    keepsDays: 5,
  },
  {
    id: "mango-milkshake",
    name: "Mango Milkshake",
    tagline: "Thick enough to stand a spoon in",
    description:
      "Mango blended with whole milk and vanilla ice cream. Not a health drink and not pretending to be.",
    category: "shake",
    price: 500,
    size: "330ml",
    ingredients: ["Mango", "Whole milk", "Vanilla ice cream", "Sugar"],
    allergens: ["milk"],
    image: "mango-milkshake.jpg",
    accent: "#F5C15B",
    bestseller: true,
    keepsDays: 2,
  },
  {
    id: "mango-milkcake",
    name: "Mango Milkcake",
    tagline: "Soaked, chilled, gone",
    description:
      "Sponge soaked in sweetened milk, topped with fresh mango. Served cold in a tub, eaten with a spoon.",
    category: "dessert",
    price: 800,
    size: "Single tub",
    ingredients: [
      "Wheat flour", "Whole milk", "Condensed milk", "Egg",
      "Sugar", "Mango", "Butter",
    ],
    allergens: ["milk", "eggs", "wheat", "gluten"],
    image: "mango-milkcake.jpg",
    accent: "#EFB33C",
    keepsDays: 3,
  },
  {
    id: "mini-egg-crunch-cake",
    name: "Mini Egg Crunch Cake",
    tagline: "The Ramadan bestseller",
    description:
      "The one that broke our record month. Chocolate crunch base, milk chocolate top, crushed mini eggs through the middle.",
    category: "dessert",
    price: 800,
    size: "Single tub",
    ingredients: [
      "Milk chocolate", "Wheat biscuit", "Butter",
      "Golden syrup", "Mini eggs", "Cocoa",
    ],
    allergens: ["milk", "wheat", "gluten", "soya"],
    image: "mini-egg-crunch-cake.jpg",
    accent: "#C98B3A",
    bestseller: true,
    keepsDays: 5,
  },
  {
    id: "biscoff-crunch-cake",
    name: "Biscoff Crunch Cake",
    tagline: "Caramelised and heavy",
    description:
      "Crunch base with Biscoff spread folded through, finished with a melted Biscoff top and crumbled biscuit.",
    category: "dessert",
    price: 800,
    size: "Single tub",
    ingredients: [
      "Biscoff spread", "Biscoff biscuit", "Milk chocolate",
      "Butter", "Golden syrup",
    ],
    allergens: ["milk", "wheat", "gluten", "soya"],
    image: "biscoff-crunch-cake.jpg",
    accent: "#B87333",
    keepsDays: 5,
  },
];

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "reset",
    name: "The Reset",
    price: 1200,
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
    price: 1900,
    listPrice: 2150,
    contents: "3 juices + 1 dessert, every week",
    bestValue: true,
    blurb:
      "The one most people land on. Juices for the week and something for Sunday night.",
    includes: [
      "3 × 330ml juices, your pick",
      "1 × dessert tub, your pick",
      "Delivered every Sunday",
      "Free delivery, always",
      "First pick of new flavours",
    ],
  },
  {
    id: "household",
    name: "The Household",
    price: 3600,
    listPrice: 4300,
    contents: "6 juices + 2 desserts, every week",
    blurb:
      "Built for two people, or one person who has stopped pretending. The best price per bottle we do.",
    includes: [
      "6 × 330ml juices, your pick",
      "2 × dessert tubs, your pick",
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

export const allergenLabel: Record<Allergen, string> = {
  milk: "Milk",
  eggs: "Eggs",
  wheat: "Wheat",
  gluten: "Gluten",
  soya: "Soya",
  nuts: "Nuts",
  peanuts: "Peanuts",
  sesame: "Sesame",
};

export const categoryLabel: Record<Category, string> = {
  juice: "Cold Pressed",
  shake: "Milkshakes",
  dessert: "Desserts",
  shot: "Shots",
};

/** Outward code check, e.g. "ng7 2rd" → true. */
export const isInDeliveryArea = (postcode: string): boolean => {
  const outward = postcode.trim().toUpperCase().split(/\s+/)[0];
  return (DELIVERY.postcodes as readonly string[]).includes(outward);
};
