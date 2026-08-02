import { NextResponse } from "next/server";
import { MissingEnvError, stripeConfigured } from "@/lib/env";
import { getStripe, summariseSession } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reads back a finished Checkout Session, so the confirmation page can show the
 * order rather than a generic thank-you.
 *
 * Read-only, and deliberately narrow: `summariseSession` decides what leaves
 * this server, and it leaves out the address, the phone number and the full
 * email. A session id in a return URL is not a secret worth betting somebody's
 * personal details on.
 *
 * The page works fine without this — it falls back to the generic wording — so
 * every failure here is answered honestly and quietly rather than loudly.
 */

/** Stripe session ids: `cs_test_…` / `cs_live_…`, alphanumeric after that. */
const SESSION_ID = /^cs_[A-Za-z0-9_]{8,120}$/;

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");

  if (!sessionId || !SESSION_ID.test(sessionId)) {
    return NextResponse.json(
      { error: "That order reference didn't look right.", code: "bad_id" },
      { status: 400 },
    );
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Ordering isn't switched on yet.", code: "stripe_unconfigured" },
      { status: 503 },
    );
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    return NextResponse.json({ order: summariseSession(session) });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`[checkout/session] ${error.message}`);
      return NextResponse.json(
        {
          error: "Ordering isn't switched on yet.",
          code: "stripe_unconfigured",
        },
        { status: 503 },
      );
    }

    // Most often an id from another Stripe account or a very old session.
    console.warn(
      "[checkout/session] Could not retrieve session:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "We couldn't find that order.", code: "not_found" },
      { status: 404 },
    );
  }
}
