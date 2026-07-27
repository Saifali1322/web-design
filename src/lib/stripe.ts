import Stripe from "stripe";
import { requireStripeSecretKey } from "@/lib/env";
import {
  DELIVERY,
  formatPrice,
  getProduct,
  isInDeliveryArea,
  type Product,
} from "@/lib/catalogue";

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
 * supplies product ids, quantities and a postcode.
 * ------------------------------------------------------------------ */

export interface PricedLine {
  product: Product;
  quantity: number;
  /** product.price * quantity, in pence. */
  lineTotal: number;
}

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
  | { ok: false; code: "empty_order"; message: string }
  | { ok: false; code: "below_minimum"; message: string };

export type PricingResult = { ok: true; order: PricedOrder } | PricingFailure;

/** Maximum units of any single product in one order. Mirrors the cart cap. */
const MAX_QUANTITY_PER_PRODUCT = 99;

/**
 * Turns untrusted {productId, quantity} pairs into a fully priced order.
 * Duplicate ids are merged rather than rejected — a client can legitimately
 * send the same product twice.
 */
export function priceOrder(
  requested: ReadonlyArray<{ productId: string; quantity: number }>,
): PricingResult {
  const merged = new Map<string, number>();

  for (const line of requested) {
    const product = getProduct(line.productId);
    if (!product) {
      return {
        ok: false,
        code: "unknown_product",
        productId: line.productId,
        message: `We no longer sell "${line.productId}". Remove it from your basket and try again.`,
      };
    }
    const running = (merged.get(product.id) ?? 0) + line.quantity;
    merged.set(product.id, Math.min(running, MAX_QUANTITY_PER_PRODUCT));
  }

  const lines: PricedLine[] = [];
  for (const [productId, quantity] of merged) {
    const product = getProduct(productId);
    if (!product || quantity <= 0) continue;
    // Price comes from the catalogue, never from the request body.
    lines.push({ product, quantity, lineTotal: product.price * quantity });
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

/** Builds Checkout line items for a one-off order, delivery included. */
export function toStripeLineItems(
  order: PricedOrder,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.lines.map(
    ({ product, quantity }) => ({
      quantity,
      price_data: {
        currency: "gbp",
        unit_amount: product.price,
        product_data: {
          name: product.name,
          description: `${product.size} · ${product.tagline}`,
          metadata: { product_id: product.id, category: product.category },
        },
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
  const lines = order.lines.map(
    (l) => `${l.quantity} × ${l.product.name} (${formatPrice(l.lineTotal)})`,
  );
  if (order.deliveryFee > 0) {
    lines.push(`Delivery (${formatPrice(order.deliveryFee)})`);
  } else {
    lines.push("Delivery (free)");
  }
  return truncateForMetadata(lines.join(", "));
}

/** Stripe rejects metadata values over 500 characters. */
export function truncateForMetadata(value: string, limit = 500): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}
