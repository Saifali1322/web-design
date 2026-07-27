import { NextResponse } from "next/server";
import { z } from "zod";
import { DELIVERY, formatPrice } from "@/lib/catalogue";
import { absoluteUrl, MissingEnvError, stripeConfigured } from "@/lib/env";
import {
  checkPostcode,
  getStripe,
  orderSummary,
  outOfAreaMessage,
  priceOrder,
  toStripeLineItems,
  truncateForMetadata,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-off orders.
 *
 * The request body carries product ids, quantities and a postcode — nothing
 * else. Every price, the delivery fee and the total are recomputed here from
 * the catalogue, so a tampered basket buys nothing at a discount.
 */

const BodySchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your basket is empty.")
    .max(50),
  postcode: z.string().min(2).max(12),
});

/** Advertises whether ordering is live, so the button can say so before a click. */
export function GET() {
  return NextResponse.json({ configured: stripeConfigured() });
}

export async function POST(request: Request) {
  // Ordering simply isn't open yet if the owner hasn't wired Stripe up. This is
  // a normal state, not an error, so it never throws.
  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error: "Ordering isn't switched on yet.",
        code: "stripe_unconfigured",
      },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed request.", code: "bad_json" },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "That order didn't look right. Refresh and try again.",
        code: "invalid_body",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // Delivery area first — cheapest check, clearest message.
  const postcode = checkPostcode(parsed.data.postcode);
  if (!postcode.ok) {
    return NextResponse.json(
      { error: outOfAreaMessage(), code: "out_of_area" },
      { status: 400 },
    );
  }

  const pricing = priceOrder(parsed.data.lines);
  if (!pricing.ok) {
    return NextResponse.json(
      { error: pricing.message, code: pricing.code },
      { status: 400 },
    );
  }

  const order = pricing.order;
  const summary = orderSummary(order);

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      currency: "gbp",
      line_items: toStripeLineItems(order),
      success_url: absoluteUrl(
        "/order/confirmed?session_id={CHECKOUT_SESSION_ID}",
      ),
      cancel_url: absoluteUrl("/order/cancelled"),
      shipping_address_collection: { allowed_countries: ["GB"] },
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      submit_type: "pay",
      // Everything the owner needs to pack the order lands here and is echoed
      // back by the webhook.
      metadata: {
        order_type: "one-off",
        postcode: postcode.formatted,
        outward_code: postcode.outward,
        delivery_city: DELIVERY.city,
        item_count: String(order.itemCount),
        subtotal_pence: String(order.subtotal),
        delivery_fee_pence: String(order.deliveryFee),
        total_pence: String(order.total),
        total_display: formatPrice(order.total),
        order_summary: summary,
      },
      payment_intent_data: {
        description: truncateForMetadata(
          `Juice Cartel — ${order.itemCount} item${
            order.itemCount === 1 ? "" : "s"
          } to ${postcode.formatted}`,
          350,
        ),
        metadata: {
          postcode: postcode.formatted,
          order_summary: summary,
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe returned a session with no redirect URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`[checkout] ${error.message}`);
      return NextResponse.json(
        {
          error: "Ordering isn't switched on yet.",
          code: "stripe_unconfigured",
        },
        { status: 503 },
      );
    }

    console.error("[checkout] Failed to create Checkout Session:", error);
    return NextResponse.json(
      {
        error: "We couldn't start checkout. Try again in a moment.",
        code: "stripe_error",
      },
      { status: 502 },
    );
  }
}
