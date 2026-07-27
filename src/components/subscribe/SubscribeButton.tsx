"use client";

import { useId, useState } from "react";
import { formatPrice, isInDeliveryArea, SOCIALS } from "@/lib/catalogue";

type Status = "idle" | "postcode" | "loading" | "not-configured" | "error";

interface SubscribeResponse {
  url?: string;
  error?: string;
  message?: string;
  code?: string;
}

/**
 * Two-step subscribe control: price button reveals a postcode field, which
 * posts { tierId, postcode } to /api/subscribe and redirects to the
 * returned checkout url. That route belongs to another agent — this only
 * assumes it returns { url } on success, and degrades honestly if it
 * signals it isn't wired up yet rather than throwing an ugly error.
 */
export default function SubscribeButton({
  tierId,
  price,
}: {
  tierId: string;
  price: number;
}) {
  const inputId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [postcode, setPostcode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const startCheckout = async (code: string) => {
    setStatus("loading");
    setLocalError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId, postcode: code }),
      });

      let data: SubscribeResponse | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }

      // The server re-validates the postcode independently of our client
      // check — if it disagrees, surface its message and let them retry
      // rather than dropping into a generic error state.
      if (data?.code === "out_of_area") {
        setStatus("postcode");
        setLocalError(
          data.error ?? "That postcode isn't on our route yet.",
        );
        return;
      }

      const reason = `${data?.error ?? ""} ${data?.message ?? ""}`.toLowerCase();
      const notConfigured =
        data?.code === "stripe_unconfigured" ||
        res.status === 501 ||
        res.status === 503 ||
        reason.includes("not configured") ||
        reason.includes("not set up") ||
        reason.includes("switched on") ||
        reason.includes("unavailable") ||
        reason.includes("coming soon");

      setStatus(notConfigured ? "not-configured" : "error");
    } catch {
      setStatus("error");
    }
  };

  const handleConfirm = () => {
    const trimmed = postcode.trim();
    if (!trimmed) {
      setLocalError("Enter your postcode so we know where to deliver.");
      return;
    }
    if (!isInDeliveryArea(trimmed)) {
      setLocalError(
        "That postcode isn't on our route yet — see the delivery page for areas we cover.",
      );
      return;
    }
    setLocalError(null);
    void startCheckout(trimmed);
  };

  if (status === "not-configured") {
    return (
      <p className="border border-gold-dim/60 bg-ink-raised px-4 py-3 text-sm leading-relaxed text-cream-dim">
        Subscriptions open soon —{" "}
        <a
          href={SOCIALS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline underline-offset-2"
        >
          message us on Instagram
        </a>{" "}
        and we&apos;ll let you know the moment they&apos;re live.
      </p>
    );
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStatus("postcode")}
        className="numeric w-full border border-gold bg-gold/10 py-3 text-sm font-medium uppercase tracking-label text-gold-bright transition-colors hover:bg-gold/20"
      >
        Subscribe — {formatPrice(price)} / week
      </button>
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
        id={inputId}
        type="text"
        autoComplete="postal-code"
        placeholder="e.g. NG7 2RD"
        value={postcode}
        disabled={status === "loading"}
        onChange={(e) => setPostcode(e.target.value)}
        className="numeric border border-ink-line bg-ink-raised px-4 py-3 text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none disabled:opacity-60"
      />

      {localError && <p className="text-sm text-warn">{localError}</p>}
      {status === "error" && (
        <p className="text-sm text-warn">
          Something went wrong placing that — try again, or{" "}
          <a
            href={SOCIALS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline"
          >
            message us on Instagram
          </a>
          .
        </p>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={status === "loading"}
          className="numeric flex-1 border border-gold bg-gold/10 py-3 text-sm font-medium uppercase tracking-label text-gold-bright transition-colors hover:bg-gold/20 disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading"
            ? "Redirecting…"
            : `Confirm — ${formatPrice(price)}/wk`}
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setLocalError(null);
          }}
          disabled={status === "loading"}
          className="border border-ink-line px-4 text-sm text-cream-dim transition-colors hover:border-gold-dim hover:text-gold disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
