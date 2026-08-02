"use client";

import Link from "next/link";
import { useId } from "react";
import { DELIVERY, formatPrice, SOCIALS } from "@/lib/catalogue";
import EmailCapture from "@/components/marketing/EmailCapture";
import {
  nearestCovered,
  useDeliveryPostcode,
} from "@/components/subscribe/postcode";

/**
 * The postcode gate.
 *
 * Eleven outward codes is a small route, and the honest thing is to say so
 * early — at the top of /delivery and before the tiers on /subscribe — rather
 * than at the checkout wall, after somebody has picked flavours and typed a
 * card number.
 *
 * So both answers are complete answers. Inside the route: yes, with the day,
 * the minimum and a way to start. Outside it: no, with the nearest codes we do
 * cover, the collection option, and a way to be told when that changes. Nobody
 * leaves this component with nothing to do.
 */

export interface PostcodeCheckProps {
  /** "full" shows the follow-on actions; "compact" is just the verdict. */
  variant?: "full" | "compact";
  className?: string;
}

export default function PostcodeCheck({
  variant = "full",
  className = "",
}: PostcodeCheckProps) {
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const { postcode, setPostcode, status, outward } = useDeliveryPostcode();

  const near = status === "out" ? nearestCovered(postcode) : [];

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-2 block text-xs uppercase tracking-label text-cream-dim"
      >
        Your postcode
      </label>

      <div className="relative sm:max-w-sm">
        <input
          id={inputId}
          name="postcode"
          type="text"
          inputMode="text"
          autoComplete="postal-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="e.g. NG7 2RD"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          aria-describedby={statusId}
          aria-invalid={status === "out" ? true : undefined}
          className={`numeric w-full border bg-ink-raised px-4 py-3 pr-11 text-cream uppercase transition-colors placeholder:normal-case placeholder:text-cream-faint focus:outline-none ${
            status === "out"
              ? "border-warn"
              : status === "in"
                ? "border-fresh/70"
                : "border-ink-line focus:border-gold"
          }`}
        />

        {/* Verdict mark, mirrored in the text below — never colour alone. */}
        {status === "in" || status === "out" ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 ${
              status === "in" ? "text-fresh" : "text-warn"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              {status === "in" ? (
                <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" />
              ) : (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              )}
            </svg>
          </span>
        ) : null}
      </div>

      {/* One live region for every verdict, so a screen reader hears the change
          instead of the field silently turning a different colour. */}
      <div id={statusId} role="status" aria-live="polite" className="mt-3">
        {status === "empty" || status === "typing" ? (
          <p className="text-sm leading-relaxed text-cream-faint">
            We deliver to {DELIVERY.postcodes.length} {DELIVERY.city}{" "}
            outward codes. Type yours and we&rsquo;ll tell you straight away.
          </p>
        ) : null}

        {status === "in" ? (
          <div className="animate-rise border-l-2 border-fresh bg-fresh/[0.06] py-3 pl-4">
            <p className="text-sm leading-relaxed text-fresh">
              <span className="numeric font-medium">{outward}</span> is on the
              route. Drops go out every {DELIVERY.dropDay}.
            </p>
            {variant === "full" ? (
              <p className="mt-1.5 text-xs leading-relaxed text-cream-dim">
                Minimum order{" "}
                <span className="numeric">
                  {formatPrice(DELIVERY.minimumOrder)}
                </span>
                , free delivery over{" "}
                <span className="numeric">
                  {formatPrice(DELIVERY.freeDeliveryThreshold)}
                </span>
                , otherwise a flat{" "}
                <span className="numeric">
                  {formatPrice(DELIVERY.deliveryFee)}
                </span>
                . We&rsquo;ll remember this postcode at the basket.
              </p>
            ) : null}
          </div>
        ) : null}

        {status === "out" ? (
          <div className="animate-rise border-l-2 border-warn bg-warn/[0.06] py-3 pl-4">
            <p className="text-sm leading-relaxed text-warn">
              <span className="numeric font-medium">{outward}</span> isn&rsquo;t
              on the route yet.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-cream-dim">
              {near.length > 0 ? (
                <>
                  We reach{" "}
                  <span className="numeric text-cream">{near.join(", ")}</span>{" "}
                  — if you work or study in one of those, we can drop there
                  instead.
                </>
              ) : (
                <>
                  We only run one van, one route, once a week — {DELIVERY.city}{" "}
                  only for now.
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>

      {/* Something to do next. Only on the full variant — the basket's compact
          copy has the checkout button underneath it already. */}
      {variant === "full" && status === "out" ? (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-cream-dim">
            Two things that might still work: collection near our kitchen, or
            we tell you the day we reach you.{" "}
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-2"
            >
              Message {SOCIALS.handle}
            </a>{" "}
            to arrange a collection before {DELIVERY.dropDay}.
          </p>
          <EmailCapture
            source="delivery-out-of-area"
            postcode={postcode}
            title={`Tell me when you reach ${outward}`}
            blurb="We add postcodes when enough people in one ask. Yours counts towards it."
            cta="Add my postcode"
          />
        </div>
      ) : null}

      {variant === "full" && status === "in" ? (
        <p className="mt-5 text-sm leading-relaxed text-cream-dim">
          Start with the{" "}
          <Link
            href="/menu"
            className="text-gold underline underline-offset-2"
          >
            full menu
          </Link>
          , or set up a{" "}
          <Link
            href="/subscribe"
            className="text-gold underline underline-offset-2"
          >
            weekly drop
          </Link>{" "}
          so it just turns up.
        </p>
      ) : null}
    </div>
  );
}
