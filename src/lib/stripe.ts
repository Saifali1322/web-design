import Stripe from "stripe";
import { requireStripeSecretKey } from "@/lib/env";
import {
  DELIVERY,
  formatPrice,
  getProduct,
  isInDeliveryArea,
  type Product,
} from "@/lib/catalogue";
import {
  buildBlend,
  sanitiseBlendName,
  type Blend,
  type BlendComponent,
} from "@/lib/blend";

/**
 * Lazily constructed Stripe client, plus the server-side pricing helpers shared
 * by the checkout and subscribe routes.
 *
 * The client is deliberately not built at module scope: importing this file must
 * stay free of side effects so the app builds and renders with no Stripe keys
 * present. It is created on first use inside a request handler and then cached
 * for the lifetime of the server process.
 */

let client: Stripe | undefined;
let clientKey: string | undefined;

export function getStripe(): Stripe {
  const key = requireStripeSecretKey();

  // Rebuild if the key changed under us (dev server picking up a new .env).
  if (!client || clientKey !== key) {
    client = new Stripe(key, {
      apiVersion: Stripe.API_VERSION,
      typescript: true,
      appInfo: {
        name: "Juice Cartel",
        url: "https://juicecartel.uk",
      },
      maxNetworkRetries: 2,
    });
    clientKey = key;
  }

  return client;
}

export type { Stripe };

/* ------------------------------------------------------------------ *
 * Server-side pricing
 *
 * Everything below recomputes money from the catalogue. Nothing the client
 * sends about price, delivery or totals is ever trusted — the request only
 * supplies product ids, blend recipes, quantities and a postcode. A custom
 * blend is priced by the same {@link buildBlend} the mixer used to show it, so
 * the two cannot drift apart.
 * ------------------------------------------------------------------ */

interface PricedLineBase {
  quantity: number;
  /** Per-unit price in pence, always derived here. */
  unitPrice: number;
  /** unitPrice * quantity, in pence. */
  lineTotal: number;
  /** What the customer sees on the Stripe page and the pack sheet. */
  name: string;
}

export interface PricedProductLine extends PricedLineBase {
  kind: "product";
  product: Product;
}

export interface PricedBlendLine extends PricedLineBase {
  kind: "blend";
  blend: Blend;
}

export type PricedLine = PricedProductLine | PricedBlendLine;

/** A line before its quantity is known — what the merge pass carries around. */
type PricedUnit =
  | Omit<PricedProductLine, "quantity" | "lineTotal">
  | Omit<PricedBlendLine, "quantity" | "lineTotal">;

export interface PricedOrder {
  lines: PricedLine[];
  /** Goods total in pence, before delivery. */
  subtotal: number;
  /** 0 once the free-delivery threshold is cleared. */
  deliveryFee: number;
  total: number;
  itemCount: number;
}

export type PricingFailure =
  | { ok: false; code: "unknown_product"; message: string; productId: string }
  | { ok: false; code: "invalid_blend"; message: string }
  | { ok: false; code: "empty_order"; message: string }
  | { ok: false; code: "below_minimum"; message: string };

export type PricingResult = { ok: true; order: PricedOrder } | PricingFailure;

/** Maximum units of any single line in one order. Mirrors the cart cap. */
const MAX_QUANTITY_PER_PRODUCT = 99;

/** A catalogue product, by id and quantity. */
export interface RequestedProductLine {
  kind?: "product";
  productId: string;
  quantity: number;
}

/**
 * A custom blend, as its recipe. No price, no name the server has to trust —
 * the recipe is enough to rebuild both.
 */
export interface RequestedBlendLine {
  kind: "blend";
  components: ReadonlyArray<BlendComponent>;
  name?: string;
  quantity: number;
}

export type RequestedLine = RequestedProductLine | RequestedBlendLine;

/**
 * Turns untrusted lines into a fully priced order.
 *
 * Duplicates are merged rather than rejected — a client can legitimately send
 * the same product, or the same blend, twice. Blends merge on their canonical
 * encoding, so 2:1 orange/carrot sent as two lines becomes one line of two.
 */
export function priceOrder(
  requested: ReadonlyArray<RequestedLine>,
): PricingResult {
  // Keyed by product id or blend code, so both kinds share one merge pass.
  const merged = new Map<string, { unit: PricedUnit; quantity: number }>();

  const bump = (key: string, quantity: number, build: () => PricedUnit) => {
    const existing = merged.get(key);
    merged.set(key, {
      unit: existing?.unit ?? build(),
      quantity: Math.min(
        (existing?.quantity ?? 0) + quantity,
        MAX_QUANTITY_PER_PRODUCT,
      ),
    });
  };

  for (const line of requested) {
    if (line.kind === "blend") {
      // Recomputed from the catalogue with the same rule the mixer used. The
      // client's idea of the price never reaches this function.
      const result = buildBlend(line.components);
      if (!result.ok) {
        return {
          ok: false,
          code: "invalid_blend",
          message: result.error.message,
        };
      }
      const blend = result.blend;
      bump(`b:${blend.code}`, line.quantity, () => ({
        kind: "blend",
        blend,
        name: sanitiseBlendName(line.name, blend.autoName),
        unitPrice: blend.price,
      }));
      continue;
    }

    const product = getProduct(line.productId);
    if (!product) {
      return {
        ok: false,
        code: "unknown_product",
        productId: line.productId,
        message: `We no longer sell "${line.productId}". Remove it from your basket and try again.`,
      };
    }
    bump(`p:${product.id}`, line.quantity, () => ({
      kind: "product",
      product,
      name: product.name,
      unitPrice: product.price,
    }));
  }

  const lines: PricedLine[] = [];
  for (const { unit, quantity } of merged.values()) {
    if (quantity <= 0) continue;
    // Price comes from the catalogue, never from the request body.
    lines.push({ ...unit, quantity, lineTotal: unit.unitPrice * quantity });
  }

  if (lines.length === 0) {
    return {
      ok: false,
      code: "empty_order",
      message: "Your basket is empty.",
    };
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  if (subtotal < DELIVERY.minimumOrder) {
    return {
      ok: false,
      code: "below_minimum",
      message: `Minimum order is ${formatPrice(DELIVERY.minimumOrder)}. Add ${formatPrice(
        DELIVERY.minimumOrder - subtotal,
      )} more to check out.`,
    };
  }

  const deliveryFee =
    subtotal >= DELIVERY.freeDeliveryThreshold ? 0 : DELIVERY.deliveryFee;

  return {
    ok: true,
    order: {
      lines,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    },
  };
}

/* ---------- postcodes ---------- */

export interface PostcodeCheck {
  ok: boolean;
  /** Tidied for display and storage, e.g. "ng7 2rd" → "NG7 2RD". */
  formatted: string;
  /** Outward code only, e.g. "NG7". */
  outward: string;
}

export function checkPostcode(raw: string): PostcodeCheck {
  const formatted = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const outward = formatted.split(" ")[0] ?? "";
  return { ok: isInDeliveryArea(raw), formatted, outward };
}

export const outOfAreaMessage = (): string =>
  `We only deliver around ${DELIVERY.city} right now (${DELIVERY.postcodes.join(", ")}).`;

/* ---------- Stripe line items ---------- */

type StripeProductData =
  Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData;

function productData(line: PricedLine): StripeProductData {
  if (line.kind === "blend") {
    return {
      // The pour goes in the description, not just the metadata: the Stripe
      // receipt is the only paperwork some orders get, and it has to say what
      // goes in the bottle.
      name: line.name,
      description: `Your blend · 330ml · ${line.blend.composition}`,
      metadata: {
        blend: line.blend.code,
        blend_composition: line.blend.composition,
        category: "juice",
      },
    };
  }
  return {
    name: line.product.name,
    description: `${line.product.size} · ${line.product.tagline}`,
    metadata: { product_id: line.product.id, category: line.product.category },
  };
}

/** Builds Checkout line items for a one-off order, delivery included. */
export function toStripeLineItems(
  order: PricedOrder,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.lines.map(
    (line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: line.unitPrice,
        product_data: productData(line),
      },
    }),
  );

  if (order.deliveryFee > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: order.deliveryFee,
        product_data: {
          name: `${DELIVERY.city} delivery`,
          description: `Free on orders over ${formatPrice(DELIVERY.freeDeliveryThreshold)}`,
        },
      },
    });
  }

  return items;
}

/* ---------- human-readable summaries ---------- */

/**
 * One-line-per-item summary, short enough for a Stripe metadata value
 * (500 characters) and readable in a webhook log.
 */
export function orderSummary(order: PricedOrder): string {
  const lines = order.lines.map((l) => {
    const pour = l.kind === "blend" ? ` [${l.blend.composition}]` : "";
    return `${l.quantity} × ${l.name}${pour} (${formatPrice(l.lineTotal)})`;
  });
  if (order.deliveryFee > 0) {
    lines.push(`Delivery (${formatPrice(order.deliveryFee)})`);
  } else {
    lines.push("Delivery (free)");
  }
  return truncateForMetadata(lines.join(", "));
}

/**
 * Just the bespoke bottles, one per line, for the pack sheet. Empty string when
 * the order has none — a metadata key with nothing in it is noise on a ticket.
 */
export function blendPackSheet(order: PricedOrder): string {
  const blends = order.lines.filter(
    (l): l is PricedBlendLine => l.kind === "blend",
  );
  if (blends.length === 0) return "";
  return truncateForMetadata(
    blends
      .map(
        (l) =>
          `${l.quantity} × "${l.name}" = ${l.blend.composition}` +
          (l.blend.allergens.length > 0
            ? ` [allergens: ${l.blend.allergens.join("/")}]`
            : ""),
      )
      .join(" | "),
  );
}

/** Stripe rejects metadata values over 500 characters. */
export function truncateForMetadata(value: string, limit = 500): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}
