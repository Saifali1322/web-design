import { NextResponse } from "next/server";
import { z } from "zod";
import { DELIVERY } from "@/lib/catalogue";
import {
  MAX_EMAIL_LENGTH,
  SIGNUP_SOURCES,
  normaliseEmail,
  validateEmail,
} from "@/components/marketing/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ==================================================================== *
 * EMAIL CAPTURE — STUB. NOTHING IS SENT AND NOTHING IS STORED.
 *
 * There is no email backend on this project. This route validates a signup
 * properly, rate-limits it, and then writes it to the server log — that is
 * all. Restart the server and the addresses are gone.
 *
 * The customer is never told otherwise: `GET /api/notify` reports
 * `{ configured: false }`, and every form that posts here reads that first and
 * says "we'll write it down and add you the moment the list is live" rather
 * than pretending an email is on its way.
 *
 * ---------------------------------------------------------------------
 * TO MAKE THIS REAL — the owner needs ONE of these, and about ten minutes:
 *
 *   Resend      https://resend.com — simplest. Create an audience, then set
 *               RESEND_API_KEY and RESEND_AUDIENCE_ID.
 *               POST https://api.resend.com/audiences/{id}/contacts
 *                    { email, unsubscribed: false }
 *
 *   Mailchimp   Set MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX (e.g. "us21")
 *               and MAILCHIMP_LIST_ID.
 *               POST https://{prefix}.api.mailchimp.com/3.0/lists/{id}/members
 *                    { email_address, status: "subscribed", tags: [source] }
 *
 *   Klaviyo     Set KLAVIYO_API_KEY and KLAVIYO_LIST_ID.
 *               POST https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs
 *
 * Wire it inside `record()` below — that function is the only thing to change.
 * Then flip `listConfigured()` to read the same variable, and every form on the
 * site starts telling the truth on its own with no further edits.
 *
 * Two things to keep whichever provider is chosen:
 *   • UK PECR/GDPR: this is opt-in consent for marketing. Keep the source and
 *     the timestamp, and put a working unsubscribe link in every send.
 *   • Never block on the provider. Catch its errors, log them, and still
 *     return ok — a customer who typed their address correctly should not see
 *     a failure because a third party is having a bad afternoon.
 * ==================================================================== */

/** True once a provider key is present. Add the real variable name here. */
function listConfigured(): boolean {
  // TODO: e.g. return typeof process.env.RESEND_API_KEY === "string" &&
  //            process.env.RESEND_API_KEY.trim().length > 0;
  return false;
}

const BodySchema = z.object({
  email: z.string().min(3).max(MAX_EMAIL_LENGTH),
  source: z.enum(SIGNUP_SOURCES),
  /** Optional — only sent by the out-of-area form, so the owner can see demand. */
  postcode: z.string().max(12).optional(),
  /**
   * Honeypot. A real person never sees this field, so anything in it is a bot.
   * Answered with a cheerful 200 rather than an error: telling a scraper which
   * of its guesses worked is free help.
   */
  company: z.string().max(200).optional(),
});

/**
 * Advertises whether the list is actually connected, so a form can promise the
 * right thing before anyone types.
 */
export function GET() {
  return NextResponse.json({ configured: listConfigured() });
}

/* ---------- crude in-process rate limit ----------
 *
 * Not a security control — it is one process's memory and resets on deploy.
 * It exists so a bored person with a loop can't fill the owner's log (or, once
 * a provider is wired up, their contact quota) in an afternoon. A real limiter
 * belongs at the edge.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();

  // Cheap sweep so the map can't grow without bound on a long-lived process.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  const existing = hits.get(key);
  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > MAX_PER_WINDOW;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
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
      { error: "That didn't look right. Try again.", code: "invalid_body" },
      { status: 400 },
    );
  }

  // Bots first, before anything is logged or rate-limited on their behalf.
  if (parsed.data.company && parsed.data.company.trim().length > 0) {
    return NextResponse.json({ ok: true, delivered: listConfigured() });
  }

  const problem = validateEmail(parsed.data.email);
  if (problem) {
    return NextResponse.json(
      {
        error: "That doesn't look like an email address — check for a typo.",
        code: "invalid_email",
      },
      { status: 400 },
    );
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      {
        error: "That's a lot of signups. Give it a minute and try again.",
        code: "rate_limited",
      },
      { status: 429 },
    );
  }

  const email = normaliseEmail(parsed.data.email);
  const postcode = parsed.data.postcode?.trim().toUpperCase().replace(/\s+/g, " ");

  try {
    await record({ email, source: parsed.data.source, postcode });
  } catch (error) {
    // Never fail a signup on the provider's account. The address is already in
    // the log line below, so the owner can still recover it by hand.
    console.error("[notify] Failed to record signup:", error);
  }

  // `delivered` is the honest bit: false means "we have it, but nothing was
  // sent". The form uses it to choose its wording.
  return NextResponse.json({ ok: true, delivered: listConfigured() });
}

/**
 * The one function to replace when a provider is connected. See the block at
 * the top of this file for the exact call each provider expects.
 */
async function record(signup: {
  email: string;
  source: string;
  postcode?: string;
}): Promise<void> {
  console.log(
    [
      "",
      `  ${"─".repeat(52)}`,
      "  EMAIL SIGNUP — Juice Cartel  (not stored: no provider connected)",
      `  ${"─".repeat(52)}`,
      `  Email     ${signup.email}`,
      `  Source    ${signup.source}`,
      `  Postcode  ${signup.postcode ?? "—"}`,
      `  Area      ${DELIVERY.city}`,
      `  At        ${new Date().toISOString()}`,
      `  ${"─".repeat(52)}`,
      "",
    ].join("\n"),
  );
}
