"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DELIVERY, subscriptionTiers } from "@/lib/catalogue";
import EmailCapture from "@/components/marketing/EmailCapture";
import TierCard from "@/components/subscribe/TierCard";
import { useDeliveryPostcode } from "@/components/subscribe/postcode";

/**
 * The three plans, plus the one question that decides whether any of them are
 * bookable: has the owner wired Stripe up yet?
 *
 * Asked once here and passed down, so the cards render in the right state on
 * first paint instead of three of them flickering from "Subscribe" to
 * "message us" a moment after the page settles. Until the answer arrives the
 * buttons are disabled rather than lying in either direction.
 */
export default function SubscribePlans() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const { status: areaStatus, outward } = useDeliveryPostcode();

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/subscribe", { method: "GET" });
        const data: unknown = await res.json();
        const live =
          typeof data === "object" &&
          data !== null &&
          (data as { configured?: unknown }).configured === true;
        if (active) setConfigured(live);
      } catch {
        // A failed probe shouldn't lock the page. Let the POST decide.
        if (active) setConfigured(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* Somebody who has already checked an out-of-area postcode should not
          be shown three buy buttons as if nothing happened. */}
      {areaStatus === "out" ? (
        <div
          role="status"
          className="mb-8 border-l-2 border-warn bg-warn/[0.06] py-3 pl-4"
        >
          <p className="text-sm leading-relaxed text-warn">
            We can&rsquo;t run a weekly drop to{" "}
            <span className="numeric">{outward}</span> yet.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-cream-dim">
            The plans below are still here to look at, but the route has to
            reach you before one can start.{" "}
            <Link
              href="/delivery"
              className="text-gold underline underline-offset-2"
            >
              See the {DELIVERY.postcodes.length} codes we cover
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {subscriptionTiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} configured={configured} />
        ))}
      </div>

      {configured === false ? (
        <div className="mt-10">
          <EmailCapture
            source="subscribe-waitlist"
            title="Tell me when weekly plans open"
            blurb="Card subscriptions aren't switched on yet. One email the day they are — and we'll still set one up by hand in the meantime if you message us."
            cta="Notify me"
          />
        </div>
      ) : null}
    </>
  );
}
