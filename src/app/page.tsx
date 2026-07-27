import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import Bestsellers from "@/components/home/Bestsellers";
import HowItWorks from "@/components/home/HowItWorks";
import SubscriptionTeaser from "@/components/home/SubscriptionTeaser";
import SocialProof from "@/components/home/SocialProof";
import DeliveryStrip from "@/components/home/DeliveryStrip";
import { revealNoScriptCss } from "@/components/ui/Reveal";

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
      <Bestsellers />
      <HowItWorks />
      <SubscriptionTeaser />
      <SocialProof />
      <DeliveryStrip />
    </>
  );
}
