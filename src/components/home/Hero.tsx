import { readdirSync } from "node:fs";
import { join } from "node:path";
import CinematicHero from "@/components/hero/CinematicHero";

/**
 * The homepage hero. This file stays as the page's entry point so
 * `app/page.tsx` does not need to know that the hero happens to be a client
 * component — and, now, so that the one question the client cannot answer
 * gets answered on the server.
 *
 * That question is "which flavours have a photograph yet?". The owner sends
 * product renders in batches; the hero has to cross-fade to a juice's own
 * shot when one exists and stay on the group shot when it does not, and it
 * has to do that without ever requesting a file that is not there. A client
 * component can only find out by asking and handling the 404, which means a
 * console full of noise and, on a slow connection, a visible hole where the
 * product should be.
 *
 * A server component can just look. This runs once, at build, because the
 * homepage is static — so the cost is a single directory read per deploy, and
 * dropping a new file into /public/products makes it appear on the next
 * build with no code change anywhere.
 */
function availableProductImages(): string[] {
  try {
    return readdirSync(join(process.cwd(), "public", "products")).filter((f) =>
      /\.(png|jpe?g|webp|avif)$/i.test(f),
    );
  } catch {
    /* No directory, or a runtime with no filesystem. The hero treats an empty
       list as "no individual shots yet" and stays on the lineup, which is a
       complete, good-looking hero rather than a broken one. */
    return [];
  }
}

export function Hero() {
  return <CinematicHero availableImages={availableProductImages()} />;
}

export default Hero;
