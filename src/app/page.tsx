import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import Difference from "@/components/home/Difference";
import Bestsellers from "@/components/home/Bestsellers";
import BuildABlend from "@/components/home/BuildABlend";
import HowItWorks from "@/components/home/HowItWorks";
import SubscriptionTeaser from "@/components/home/SubscriptionTeaser";
import DeliveryStrip from "@/components/home/DeliveryStrip";
import { revealNoScriptCss } from "@/components/ui/Reveal";

/**
 * One scroll, one idea each:
 *
 *   Hero           what this is
 *   TrustBar       the four facts that define it
 *   Difference     why it is not the bottle in the supermarket
 *   Bestsellers    what that actually buys you, off the shelf
 *   BuildABlend    what that actually buys you, mixed to order
 *   Subscription   the cheaper, standing way to keep buying it
 *   HowItWorks     how it reaches you, and why there is a deadline
 *   DeliveryStrip  where we go, and how to start
 *
 * BuildABlend sits right after Bestsellers because both answer "what can I
 * buy": one off the menu, one mixed. Keeping them adjacent means the mixer
 * never has to compete with the subscription pitch or the delivery mechanics
 * for attention.
 *
 * SocialProof is written but deliberately not rendered here. It is an
 * empty-state section (no real reviews yet), and an empty-state section is
 * exactly the kind of thing that makes a page feel long without giving
 * anyone a reason to keep scrolling. Re-add it once REVIEWS in
 * SocialProof.tsx actually has quotes in it — a section that admits it has
 * nothing is worse than no section at all.
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
      <BuildABlend />
      <SubscriptionTeaser />
      <HowItWorks />
      <DeliveryStrip />
    </>
  );
}
