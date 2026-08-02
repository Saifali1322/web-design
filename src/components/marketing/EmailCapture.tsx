"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SOCIALS } from "@/lib/catalogue";
import {
  emailProblemMessage,
  MAX_EMAIL_LENGTH,
  maskEmail,
  validateEmail,
  type SignupSource,
} from "@/components/marketing/email";

/**
 * The only email form on the site.
 *
 * It posts to `/api/notify`, which is a stub — nothing is sent and nothing is
 * stored beyond a server log line. That is not hidden from the customer: the
 * form asks the route up front whether a list provider is connected and
 * changes what it promises accordingly. Somebody handing over their address
 * deserves to know whether an email is actually coming.
 *
 * Everything else here is the boring, load-bearing stuff a form needs: a real
 * <label>, errors announced rather than merely coloured, a disabled/busy state
 * that can't be double-submitted, and a honeypot the eye never sees.
 */

type Status = "checking" | "idle" | "submitting" | "done" | "error";

export interface EmailCaptureProps {
  /** Which form this is, for the owner's segmentation. */
  source: SignupSource;
  /** Heading above the field. Keep it a promise, not a demand. */
  title: string;
  /** One line under the heading saying what will actually arrive. */
  blurb: string;
  /** Overrides the button text. Defaults to "Keep me posted". */
  cta?: string;
  /** Sent alongside the address — used by the out-of-area form. */
  postcode?: string;
  /** "panel" draws its own frame; "bare" sits inside something that already has one. */
  variant?: "panel" | "bare";
  className?: string;
}

export default function EmailCapture({
  source,
  title,
  blurb,
  cta = "Keep me posted",
  postcode,
  variant = "panel",
  className = "",
}: EmailCaptureProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  /** Whether a real provider is wired up. Null until the probe answers. */
  const [listLive, setListLive] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ask before anyone types, so the wording is right the first time it is read
  // rather than corrected after they have already committed their address.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/notify", { method: "GET" });
        const data: unknown = await res.json();
        const configured =
          typeof data === "object" &&
          data !== null &&
          (data as { configured?: unknown }).configured === true;
        if (active) {
          setListLive(configured);
          setStatus("idle");
        }
      } catch {
        // A failed probe shouldn't hide the form. Assume the cautious wording.
        if (active) {
          setListLive(false);
          setStatus("idle");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const problem = validateEmail(email);
    if (problem) {
      setError(emailProblemMessage[problem]);
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source,
          ...(postcode?.trim() ? { postcode: postcode.trim() } : {}),
          // Always sent; a real person leaves it empty.
          company: honeypot,
        }),
      });

      const data: unknown = await res.json().catch(() => null);
      const payload = (data ?? {}) as {
        ok?: boolean;
        delivered?: boolean;
        error?: string;
      };

      if (!res.ok || payload.ok !== true) {
        setError(
          payload.error ?? "We couldn't save that. Try again in a moment.",
        );
        setStatus("error");
        return;
      }

      setListLive(payload.delivered === true);
      setStatus("done");
    } catch {
      setError(
        "We couldn't reach us — check your connection and try again, or message us on Instagram.",
      );
      setStatus("error");
    }
  }

  const frame =
    variant === "panel"
      ? "border border-ink-line bg-ink-card p-6 sm:p-7"
      : "";

  if (status === "done") {
    return (
      <div className={`${frame} ${className}`}>
        <div role="status" aria-live="polite">
          <p className="font-display text-xl text-foil">
            {listLive ? "You're on the list" : "Noted — thank you"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cream-dim">
            {listLive ? (
              <>
                We&rsquo;ve got{" "}
                <span className="text-cream">{maskEmail(email)}</span>. Nothing
                more to do — we&rsquo;ll write when there&rsquo;s something
                worth writing about.
              </>
            ) : (
              <>
                We&rsquo;ve written{" "}
                <span className="text-cream">{maskEmail(email)}</span>{" "}down. Our
                mailing list isn&rsquo;t switched on yet, so no email is on its
                way — the fastest way to hear from us today is{" "}
                <a
                  href={SOCIALS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline underline-offset-2"
                >
                  {SOCIALS.handle}
                </a>{" "}
                on Instagram.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <div className={`${frame} ${className}`}>
      <h3 className="font-display text-xl text-foil">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-cream-dim">{blurb}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5">
        <label
          htmlFor={fieldId}
          className="mb-2 block text-xs uppercase tracking-label text-cream-dim"
        >
          Email address
        </label>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            ref={inputRef}
            id={fieldId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={MAX_EMAIL_LENGTH}
            placeholder="you@example.com"
            value={email}
            disabled={busy || status === "checking"}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hintId}
            className={`w-full flex-1 border bg-ink-raised px-4 py-3 text-cream transition-colors placeholder:text-cream-faint focus:outline-none disabled:opacity-60 ${
              error ? "border-warn" : "border-ink-line focus:border-gold"
            }`}
          />

          {/* Honeypot. Hidden from sight and from assistive tech, and kept out
              of the tab order, so only something filling fields blindly finds
              it. */}
          <div aria-hidden className="hidden">
            <label htmlFor={`${fieldId}-company`}>Company</label>
            <input
              id={`${fieldId}-company`}
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={busy || status === "checking"}
            aria-busy={busy}
            className="shrink-0 border border-gold bg-gold/10 px-6 py-3 text-xs font-medium uppercase tracking-label text-gold-bright transition-colors hover:bg-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : cta}
          </button>
        </div>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-2.5 text-sm leading-relaxed text-warn"
          >
            {error}
          </p>
        ) : (
          <p
            id={hintId}
            className="mt-2.5 text-xs leading-relaxed text-cream-faint"
          >
            {listLive === false
              ? "Our mailing list isn't connected yet — we'll note your address and add you the moment it is. No email will arrive before then."
              : "One email when it matters. Unsubscribe in one click, any time."}
          </p>
        )}
      </form>
    </div>
  );
}
