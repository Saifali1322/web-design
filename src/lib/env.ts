/**
 * Validated, lazy access to the handful of environment variables the payments
 * layer needs.
 *
 * The hard rule here: nothing in this file may throw while the module is being
 * evaluated. The site is deployed before Stripe is wired up, so `next build`
 * and every page render must succeed with no keys present at all. Validation
 * therefore happens inside functions, called from request handlers, where a
 * failure can be turned into a clean 503 instead of a broken build.
 */

/** Reads a variable, treating blank/whitespace-only values as absent. */
function read(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Thrown only from inside request handlers. Routes catch this and answer with
 * a 503 so an unconfigured deployment degrades politely.
 */
export class MissingEnvError extends Error {
  readonly variable: string;

  constructor(variable: string, hint: string) {
    super(`Missing environment variable ${variable}. ${hint}`);
    this.name = "MissingEnvError";
    this.variable = variable;
  }
}

/* ---------- Stripe secret key ---------- */

export const stripeSecretKey = (): string | undefined => read("STRIPE_SECRET_KEY");

/**
 * True when a Stripe secret key is present. Safe to call anywhere, including
 * during build — it never throws.
 */
export function stripeConfigured(): boolean {
  return stripeSecretKey() !== undefined;
}

export function requireStripeSecretKey(): string {
  const key = stripeSecretKey();
  if (!key) {
    throw new MissingEnvError(
      "STRIPE_SECRET_KEY",
      "Add it in the Stripe dashboard under Developers → API keys.",
    );
  }
  if (!/^sk_(test|live)_/.test(key) && !/^rk_(test|live)_/.test(key)) {
    // A publishable key here is the classic copy/paste slip, and it fails in a
    // confusing way much later, so name it now.
    throw new MissingEnvError(
      "STRIPE_SECRET_KEY",
      "The value does not look like a secret key — it should start with sk_test_, sk_live_ or rk_.",
    );
  }
  return key;
}

/* ---------- Webhook signing secret ---------- */

export const stripeWebhookSecret = (): string | undefined =>
  read("STRIPE_WEBHOOK_SECRET");

/** True when webhooks can actually be verified. Never throws. */
export function webhookConfigured(): boolean {
  return stripeConfigured() && stripeWebhookSecret() !== undefined;
}

export function requireStripeWebhookSecret(): string {
  const secret = stripeWebhookSecret();
  if (!secret) {
    throw new MissingEnvError(
      "STRIPE_WEBHOOK_SECRET",
      "Run `stripe listen` locally, or copy the signing secret from the webhook endpoint in the Stripe dashboard.",
    );
  }
  return secret;
}

/* ---------- Public site URL ---------- */

/**
 * Absolute origin used to build Stripe return URLs. Falls back sensibly rather
 * than throwing, because a missing site URL should never stop the site
 * rendering — it only matters at the moment a Checkout Session is created.
 */
export function siteUrl(): string {
  const explicit = read("NEXT_PUBLIC_SITE_URL");
  if (explicit) {
    const normalised = normaliseOrigin(explicit);
    if (normalised) return normalised;
  }

  // Vercel exposes the deployment host without a scheme.
  const vercel = read("VERCEL_PROJECT_PRODUCTION_URL") ?? read("VERCEL_URL");
  if (vercel) {
    const normalised = normaliseOrigin(
      vercel.startsWith("http") ? vercel : `https://${vercel}`,
    );
    if (normalised) return normalised;
  }

  return "http://localhost:3000";
}

/** Parses to an origin, dropping any trailing slash. Returns undefined if unusable. */
function normaliseOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

/** Builds an absolute URL against the configured origin. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
