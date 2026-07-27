import { NextResponse } from "next/server";
import { z } from "zod";
import { DELIVERY, formatPrice, getTier } from "@/lib/catalogue";
import { absoluteUrl, MissingEnvError, stripeConfigured } from "@/lib/env";
import {
  checkPostcode,
  getStripe,
  outOfAreaMessage,
  truncateForMetadata,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly subscriptions.
 *
 * The client sends a tier id and a postcode. The price is read from the
 * catalogue here — never from the request — and used to build an inline
 * recurring price, so there is no Stripe dashboard product to keep in sync.
 */

const BodySchema = z.object({
  tierId: z.string().min(1).max(64),
  postcode: z.string().min(2).max(12),
});

export function GET() {
  return NextResponse.json({ configured: stripeConfigured() });
}

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error: "Subscriptions aren't switched on yet.",
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
        error: "That didn't look right. Refresh and try again.",
        code: "invalid_body",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const postcode = checkPostcode(parsed.data.postcode);
  if (!postcode.ok) {
    return NextResponse.json(
      { error: outOfAreaMessage(), code: "out_of_area" },
      { status: 400 },
    );
  }

  // Server-side lookup: an unknown tier is a hard no.
  const tier = getTier(parsed.data.tierId);
  if (!tier) {
    return NextResponse.json(
      { error: "That plan is no longer available.", code: "unknown_tier" },
      { status: 400 },
    );
  }

  const summary = truncateForMetadata(
    `${tier.name} — ${tier.contents} — ${formatPrice(tier.price)}/week, delivered ${DELIVERY.dropDay}s to ${postcode.formatted}`,
  );

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      currency: "gbp",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            // Price comes from the catalogue, in pence.
            unit_amount: tier.price,
            recurring: { interval: "week" },
            product_data: {
              name: `Juice Cartel — ${tier.name}`,
              description: `${tier.contents}. Delivered every ${DELIVERY.dropDay}.`,
              metadata: { tier_id: tier.id },
            },
          },
        },
      ],
      success_url: absoluteUrl(
        "/order/confirmed?session_id={CHECKOUT_SESSION_ID}&plan=weekly",
      ),
      cancel_url: absoluteUrl("/order/cancelled"),
      shipping_address_collection: { allowed_countries: ["GB"] },
      phone_number_collection: { enabled: true },
      metadata: {
        order_type: "subscription",
        tier_id: tier.id,
        tier_name: tier.name,
        tier_contents: tier.contents,
        postcode: postcode.formatted,
        outward_code: postcode.outward,
        delivery_city: DELIVERY.city,
        drop_day: DELIVERY.dropDay,
        price_pence: String(tier.price),
        price_display: `${formatPrice(tier.price)}/week`,
        order_summary: summary,
      },
      // Repeat on the subscription itself so later events (renewals,
      // cancellations) still carry the delivery details.
      subscription_data: {
        description: `${tier.name} — ${tier.contents}`,
        metadata: {
          tier_id: tier.id,
          tier_name: tier.name,
          tier_contents: tier.contents,
          postcode: postcode.formatted,
          outward_code: postcode.outward,
          drop_day: DELIVERY.dropDay,
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
      console.error(`[subscribe] ${error.message}`);
      return NextResponse.json(
        {
          error: "Subscriptions aren't switched on yet.",
          code: "stripe_unconfigured",
        },
        { status: 503 },
      );
    }

    console.error("[subscribe] Failed to create Checkout Session:", error);
    return NextResponse.json(
      {
        error: "We couldn't start that subscription. Try again in a moment.",
        code: "stripe_error",
      },
      { status: 502 },
    );
  }
}
