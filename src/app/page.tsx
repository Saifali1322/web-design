import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import Difference from "@/components/home/Difference";
import Bestsellers from "@/components/home/Bestsellers";
import SocialProof from "@/components/home/SocialProof";
import HowItWorks from "@/components/home/HowItWorks";
import SubscriptionTeaser from "@/components/home/SubscriptionTeaser";
import DeliveryStrip from "@/components/home/DeliveryStrip";
import { revealNoScriptCss } from "@/components/ui/Reveal";

/**
 * The order below is an argument, not a list of modules. Each section answers
 * the question the one above it raises:
 *
 *   Hero           what this is
 *   TrustBar       the four facts that define it
 *   Difference     why it is not the bottle in the supermarket
 *   Bestsellers    what that actually buys you
 *   SocialProof    who says so, and what can be checked while nobody has
 *   HowItWorks     how it reaches you, and why there is a deadline
 *   Subscription   what it costs, and where the saving comes from
 *   DeliveryStrip  where we go, and how to start
 *
 * Reordering these breaks the argument, so any new section needs a place in
 * that sequence rather than a slot at the end.
 *
 * They are also deliberately not the same shape. Difference hangs its heading
 * into the left margin and splits 60/40; Bestsellers runs a card grid with a
 * note in the last cell; SocialProof is quieter and shorter than either; the
 * subscription block is the tallest thing on the page. A stack of eight
 * identical full-width bands is what this was, and it is the single clearest
 * sign that nobody chose anything.
 */
export default function Home() {
  return (
    <>
      {/* Scroll reveals start hidden and are un-hidden by JavaScript. With
          scripting off that would leave blank sections, so this puts them
          back. Must stay on any page that uses <Reveal>. */}
      <noscript>
        <style>{revealNoScriptCss}</style>
      </noscript>

      <Hero />
      <TrustBar />
      <Difference />
      <Bestsellers />
      <SocialProof />
      <HowItWorks />
      <SubscriptionTeaser />
      <DeliveryStrip />
    </>
  );
}
