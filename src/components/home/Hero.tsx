import CinematicHero from "@/components/hero/CinematicHero";

/**
 * The homepage hero is the animated bottle scene. This file stays as the
 * page's entry point so `app/page.tsx` does not need to know that the hero
 * happens to be a client component.
 */
export function Hero() {
  return <CinematicHero />;
}

export default Hero;
