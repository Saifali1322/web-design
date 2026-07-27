import { NextResponse } from "next/server";
import { DELIVERY } from "@/lib/catalogue";
import {
  MissingEnvError,
  requireStripeWebhookSecret,
  stripeConfigured,
} from "@/lib/env";
import { getStripe, type Stripe } from "@/lib/stripe";

// The signature is verified against the raw request body, which needs Node's
// crypto — not the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * For now this is the entire order-notification system: a paid order prints a
 * readable ticket to the server log, which the owner watches. It is deliberately
 * blunt and deliberately reliable — no database, no queue, nothing to go stale.
 *
 * Two rules hold everywhere below: verify the signature against the *raw* body,
 * and always answer 200 quickly. Stripe retries anything that isn't a 2xx, so a
 * handler that throws on an event it doesn't recognise turns one odd event into
 * an hours-long retry storm.
 */

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    // Nothing to verify against yet. 503 tells Stripe to retry later rather
    // than treating the endpoint as permanently broken.
    return NextResponse.json(
      { received: false, reason: "stripe_unconfigured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { received: false, reason: "missing_signature" },
      { status: 400 },
    );
  }

  // Must be the raw text. Parsing to JSON first would break the signature.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      requireStripeWebhookSecret(),
    );
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`[webhook] ${error.message}`);
      return NextResponse.json(
        { received: false, reason: "webhook_secret_missing" },
        { status: 503 },
      );
    }
    // A bad signature is either a misconfigured secret or someone poking the
    // endpoint. Either way: 400, no retry.
    console.warn(
      "[webhook] Signature verification failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { received: false, reason: "invalid_signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription") {
          logNewSubscription(session);
        } else {
          logNewOrder(session);
        }
        break;
      }

      case "customer.subscription.deleted": {
        logCancelledSubscription(event.data.object);
        break;
      }

      default:
        // Everything else is fine and ignorable — Stripe sends plenty.
        break;
    }
  } catch (error) {
    // A formatting slip in a log line must never cost us the 200; Stripe would
    // redeliver an order that was, in fact, received.
    console.error(`[webhook] Handler error for ${event.type}:`, error);
  }

  return NextResponse.json({ received: true });
}

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

/**
 * TODO — replace console logging with a real notification.
 *
 * This is the single place to wire the owner's alerts. Everything needed is
 * already on `session.metadata` (order summary, postcode, totals) and
 * `session.customer_details` (name, email, phone), so a provider swap is a
 * change to this function alone.
 *
 *   • Email: Resend / Postmark → owner's inbox, plus a customer confirmation
 *     that must repeat the allergen information (legal requirement for food
 *     sold at distance — it has to reach the customer with the delivery too).
 *   • SMS: Twilio / MessageBird → owner's mobile for same-day drops.
 *
 * Keep it non-blocking: send failures must be caught here so the handler still
 * returns 200 and Stripe does not redeliver a paid order.
 */
function notifyOwner(kind: string, body: string): void {
  console.log(`\n${body}\n`);
  void kind;
}

/* ---------- formatters ---------- */

function logNewOrder(session: Stripe.Checkout.Session): void {
  const meta = session.metadata ?? {};
  const customer = session.customer_details;
  const shipping = session.collected_information?.shipping_details ?? null;

  const lines = [
    rule(),
    "  NEW ORDER — Juice Cartel",
    rule(),
    `  Placed    ${timestamp(session.created)}`,
    `  Total     ${money(session.amount_total, session.currency)}`,
    `  Payment   ${session.payment_status}`,
    "",
    `  Customer  ${customer?.name ?? shipping?.name ?? "—"}`,
    `  Email     ${customer?.email ?? "—"}`,
    `  Phone     ${customer?.phone ?? "—"}`,
    "",
    "  Items",
    ...summaryLines(meta.order_summary),
    "",
    `  Subtotal  ${pence(meta.subtotal_pence)}`,
    `  Delivery  ${pence(meta.delivery_fee_pence)}`,
    "",
    `  Deliver to ${DELIVERY.city} — ${meta.postcode ?? "postcode not captured"}`,
    ...addressLines(shipping?.address),
    rule(),
    `  Stripe session ${session.id}`,
    rule(),
  ];

  notifyOwner("order", lines.join("\n"));
}

function logNewSubscription(session: Stripe.Checkout.Session): void {
  const meta = session.metadata ?? {};
  const customer = session.customer_details;
  const shipping = session.collected_information?.shipping_details ?? null;

  const lines = [
    rule(),
    "  NEW SUBSCRIPTION — Juice Cartel",
    rule(),
    `  Started   ${timestamp(session.created)}`,
    `  Plan      ${meta.tier_name ?? meta.tier_id ?? "—"}`,
    `  Includes  ${meta.tier_contents ?? meta.order_summary ?? "—"}`,
    `  Price     ${meta.price_display ?? money(session.amount_total, session.currency)}`,
    `  Drop day  Every ${meta.drop_day ?? DELIVERY.dropDay}`,
    "",
    `  Customer  ${customer?.name ?? shipping?.name ?? "—"}`,
    `  Email     ${customer?.email ?? "—"}`,
    `  Phone     ${customer?.phone ?? "—"}`,
    "",
    `  Deliver to ${DELIVERY.city} — ${meta.postcode ?? "postcode not captured"}`,
    ...addressLines(shipping?.address),
    rule(),
    `  Stripe subscription ${idOf(session.subscription) ?? "pending"}`,
    rule(),
  ];

  notifyOwner("subscription", lines.join("\n"));
}

function logCancelledSubscription(subscription: Stripe.Subscription): void {
  const meta = subscription.metadata ?? {};

  const lines = [
    rule(),
    "  SUBSCRIPTION CANCELLED — Juice Cartel",
    rule(),
    `  Plan      ${meta.tier_name ?? meta.tier_id ?? "—"}`,
    `  Includes  ${meta.tier_contents ?? "—"}`,
    `  Postcode  ${meta.postcode ?? "—"}`,
    `  Ended     ${timestamp(subscription.ended_at ?? subscription.canceled_at)}`,
    `  Customer  ${idOf(subscription.customer) ?? "—"}`,
    "",
    "  Take them off the Sunday route.",
    rule(),
    `  Stripe subscription ${subscription.id}`,
    rule(),
  ];

  notifyOwner("cancellation", lines.join("\n"));
}

/* ---------- small helpers ---------- */

const rule = (): string => `  ${"─".repeat(52)}`;

/** Splits the comma-separated metadata summary back into indented lines. */
function summaryLines(summary: string | undefined): string[] {
  if (!summary) return ["    (no item summary recorded)"];
  return summary.split(", ").map((item) => `    · ${item}`);
}

function addressLines(address: Stripe.Address | undefined | null): string[] {
  if (!address) return ["    (no shipping address on the session)"];
  return [
    address.line1,
    address.line2,
    address.city,
    address.postal_code,
  ]
    .filter((part): part is string => Boolean(part))
    .map((part) => `    ${part}`);
}

/** Stripe amounts are minor units; currency comes back lowercase. */
function money(amount: number | null, currency: string | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: (currency ?? "gbp").toUpperCase(),
  }).format(amount / 100);
}

function pence(value: string | undefined): string {
  if (!value) return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? money(parsed, "gbp") : "—";
}

function timestamp(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Stripe fields are either an id or an expanded object. */
function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
