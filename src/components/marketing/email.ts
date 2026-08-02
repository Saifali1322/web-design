/**
 * Email list helpers, kept pure so the form and the API route agree.
 *
 * No React and no browser APIs: `EmailCapture` imports this to validate before
 * it posts, and `/api/notify` imports the same functions to validate again on
 * arrival. A client-side check is a courtesy; the server's is the real one.
 */

/** Longest address we will accept. RFC 5321 caps a path at 254 characters. */
export const MAX_EMAIL_LENGTH = 254;

/**
 * Where a signup came from. Kept as a closed list rather than free text so the
 * owner's list can be segmented later — "told us they're outside the route" is
 * a very different audience from "just ordered".
 */
export const SIGNUP_SOURCES = [
  "delivery-out-of-area",
  "subscribe-waitlist",
  "order-confirmed",
  "basket-unavailable",
] as const;

export type SignupSource = (typeof SIGNUP_SOURCES)[number];

export const isSignupSource = (value: unknown): value is SignupSource =>
  typeof value === "string" &&
  (SIGNUP_SOURCES as readonly string[]).includes(value);

/**
 * Deliberately not a full RFC 5322 parser — those accept addresses no mail
 * provider will ever route and reject ones they will. This checks the shape a
 * person actually types: something, an @, a domain with a dot and a plausible
 * TLD. Anything stranger is caught by the confirmation email not arriving.
 */
const SHAPE = /^[^\s@,;]+@[^\s@,;.]+(\.[^\s@,;.]+)+$/;

export type EmailProblem = "empty" | "shape" | "long";

/** Null when the address looks fine. */
export function validateEmail(raw: string): EmailProblem | null {
  const value = raw.trim();
  if (value.length === 0) return "empty";
  if (value.length > MAX_EMAIL_LENGTH) return "long";
  if (!SHAPE.test(value)) return "shape";
  // A trailing single-character TLD is almost always a slip ("...@gmail.c").
  const tld = value.slice(value.lastIndexOf(".") + 1);
  if (tld.length < 2) return "shape";
  return null;
}

/** What the field says out loud. Written to help, not to tell anyone off. */
export const emailProblemMessage: Record<EmailProblem, string> = {
  empty: "Enter your email address so we know where to write.",
  shape: "That doesn't look like an email address — check for a typo.",
  long: "That address is too long to be real. Check for a typo.",
};

/** Lower-cased and trimmed, so one person can't land on the list twice. */
export const normaliseEmail = (raw: string): string =>
  raw.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);

/**
 * Shown back to the customer after they sign up, and on the confirmation page
 * where the address came from Stripe. Enough to recognise your own address,
 * not enough to be worth harvesting from a shared screenshot or a forwarded
 * confirmation link.
 */
export function maskEmail(raw: string): string {
  const value = raw.trim();
  const at = value.lastIndexOf("@");
  if (at < 1) return value;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const head = local.slice(0, local.length > 2 ? 2 : 1);
  return `${head}${"•".repeat(Math.max(2, Math.min(6, local.length - head.length)))}@${domain}`;
}
