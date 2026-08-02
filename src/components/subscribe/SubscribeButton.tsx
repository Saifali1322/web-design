"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { DELIVERY, formatPrice, SOCIALS } from "@/lib/catalogue";
import { useDeliveryPostcode } from "@/components/subscribe/postcode";

/**
 * Starting a subscription.
 *
 * One button, and then as few steps as the postcode allows. Most people have
 * already used the checker at the top of the page, so their postcode is known
 * and pressing this goes straight to Stripe. Only somebody who arrived at the
 * tiers cold is asked for it, inline, right where they pressed.
 *
 * `configured` is passed down rather than probed here — three identical cards
 * asking the same server the same question is three requests to say one thing.
 */

type Status = "idle" | "postcode" | "loading" | "error";

/**
 * Signing up for a recurring charge and seeing an error is a special kind of
 * alarming, so every failure says what it cost. A Checkout Session that was
 * never created cannot have started a subscription or taken a payment.
 */
const reassure = (message: string): string =>
  /charged/i.test(message) ? message : `${message} Nothing has been charged.`;

interface SubscribeResponse {
  url?: string;
  error?: string;
  code?: string;
}

export default function SubscribeButton({
  tierId,
  tierName,
  price,
  configured,
}: {
  tierId: string;
  tierName: string;
  price: number;
  /** Null while the page is still asking whether subscriptions are live. */
  configured: boolean | null;
}) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  const { postcode, setPostcode, status: areaStatus } = useDeliveryPostcode();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Focus the field the moment it appears, so the next keystroke lands in it.
  useEffect(() => {
    if (status === "postcode") inputRef.current?.focus();
  }, [status]);

  const startCheckout = async (code: string) => {
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, postcode: code }),
      });

      const data: SubscribeResponse | null = await res
        .json()
        .catch(() => null);

      if (res.ok && data?.url) {
        window.location.assign(data.url);
        return;
      }

      // The server re-validates the postcode independently of our client
      // check — if it disagrees, surface its message and let them retry
      // rather than dropping into a generic error state.
      if (data?.code === "out_of_area") {
        setStatus("postcode");
        setError(data.error ?? "That postcode isn't on our route yet.");
        return;
      }

      if (res.status === 503 || data?.code === "stripe_unconfigured") {
        // The page-level notice covers this; reloading picks it up cleanly.
        setStatus("error");
        setError(
          "Subscriptions aren't switched on yet — message us and we'll set one up by hand.",
        );
        return;
      }

      setStatus("error");
      setError(reassure(data?.error ?? "We couldn't start that."));
    } catch {
      setStatus("error");
      setError(
        reassure(
          "We couldn't reach the checkout. Check your connection and try again.",
        ),
      );
    }
  };

  const attempt = () => {
    if (areaStatus === "in") {
      void startCheckout(postcode.trim());
      return;
    }
    // No postcode, or one we don't cover: ask here rather than at Stripe.
    setStatus("postcode");
    if (areaStatus === "out") {
      setError(`We don't deliver to that postcode yet — ${DELIVERY.city} only.`);
    }
  };

  const confirm = () => {
    const trimmed = postcode.trim();
    if (!trimmed) {
      setError("Enter your postcode so we know where to deliver.");
      inputRef.current?.focus();
      return;
    }
    if (areaStatus !== "in") {
      setError(
        `We don't deliver to that postcode yet — ${DELIVERY.city} only, for now.`,
      );
      inputRef.current?.focus();
      return;
    }
    void startCheckout(trimmed);
  };

  /* ---------- subscriptions not switched on ---------- */

  if (configured === false) {
    return (
      <div className="border border-gold-dim/60 bg-ink-raised px-4 py-3">
        <p className="text-sm leading-relaxed text-cream-dim">
          Weekly plans aren&rsquo;t bookable by card yet.{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2"
          >
            Message us
          </a>{" "}
          and we&rsquo;ll start {tierName} by hand.
        </p>
      </div>
    );
  }

  /* ---------- the ordinary path ---------- */

  const busy = status === "loading";

  if (status === "idle" || status === "error") {
    return (
      <div>
        {error ? (
          <p
            role="alert"
            className="mb-2.5 text-sm leading-relaxed text-warn"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={attempt}
          disabled={configured === null}
          className="numeric w-full border border-gold bg-gold/10 py-3 text-sm font-medium uppercase tracking-label text-gold-bright transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-50"
        >
          Subscribe — {formatPrice(price)} / week
        </button>

        <p className="mt-2 text-center text-xs leading-relaxed text-cream-faint">
          {areaStatus === "in" ? (
            <>Delivering to your saved postcode. Cancel any time.</>
          ) : (
            <>No minimum term. Cancel any time.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label
        htmlFor={inputId}
        className="text-xs uppercase tracking-label text-cream-dim"
      >
        Your postcode
      </label>
      <input
        ref={inputRef}
        id={inputId}
        name="postcode"
        type="text"
        autoComplete="postal-code"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={12}
        placeholder="e.g. NG7 2RD"
        value={postcode}
        disabled={busy}
        onChange={(e) => {
          setPostcode(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirm();
          }
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`numeric border bg-ink-raised px-4 py-3 uppercase text-cream placeholder:normal-case placeholder:text-cream-faint focus:outline-none disabled:opacity-60 ${
          error ? "border-warn" : "border-ink-line focus:border-gold"
        }`}
      />

      {error ? (
        <p id={errorId} role="alert" className="text-sm leading-relaxed text-warn">
          {error}{" "}
          <Link
            href="/delivery"
            className="text-gold underline underline-offset-2"
          >
            See the areas we cover
          </Link>
          .
        </p>
      ) : null}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          aria-busy={busy}
          className="numeric flex-1 border border-gold bg-gold/10 py-3 text-sm font-medium uppercase tracking-label text-gold-bright transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? "Redirecting…" : `Confirm — ${formatPrice(price)}/wk`}
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setError(null);
          }}
          disabled={busy}
          className="border border-ink-line px-4 text-sm text-cream-dim transition-colors hover:border-gold-dim hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
