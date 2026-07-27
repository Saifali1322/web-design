import { LogoLockup } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { FoilImage } from "@/components/ui/ProductCard";
import { DELIVERY, formatPrice } from "@/lib/catalogue";

/**
 * Film grain. Flat near-black banding is the giveaway of a cheap dark theme;
 * a few percent of monochrome noise over the gradients kills the banding and
 * reads as printed stock rather than a screen.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E\")";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      /* The header is sticky, so it is in flow and eats ~3.75rem of the
         viewport. Subtracting it keeps the hero exactly one screen tall
         instead of one screen plus a header. */
      className="relative isolate flex min-h-[calc(100svh-3.75rem)] items-center overflow-hidden"
    >
      {/* ---------- atmosphere ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Spotlight. Overhead on phones, behind the bottle on desktop. */}
        <div className="absolute left-1/2 top-[-22%] h-[62vh] w-[150vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(212,166,60,0.20),transparent_66%)] blur-[60px] lg:left-[70%] lg:top-[-10%] lg:h-[85vh] lg:w-[80vw]" />
        {/* A second, tighter core so the light has a source and not just a haze. */}
        <div className="absolute left-1/2 top-[2%] h-[26vh] w-[70vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(243,218,139,0.14),transparent_70%)] blur-[50px] lg:left-[70%] lg:top-[18%] lg:w-[34vw]" />
        {/* Structural hairlines — the frame the type hangs off. */}
        <div className="absolute inset-y-0 left-5 w-px bg-gradient-to-b from-transparent via-gold/12 to-transparent sm:left-8 lg:left-[max(2rem,calc(50%-36rem))]" />
        <div className="absolute inset-y-0 right-5 w-px bg-gradient-to-b from-transparent via-gold/12 to-transparent sm:right-8 lg:right-[max(2rem,calc(50%-36rem))]" />
        <div
          className="absolute inset-0 opacity-[0.055] mix-blend-screen"
          style={{ backgroundImage: GRAIN }}
        />
        {/* Settle back into pure black for the trust bar underneath. */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 pt-16 pb-16 sm:gap-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-24">
        {/* ---------- type ---------- */}
        <div className="animate-rise motion-reduce:animate-none">
          {/* inline-flex, so it hugs its own width and sits flush left while
              keeping the centred mark-over-wordmark of the packaging. */}
          <LogoLockup size="md" />

          <p
            className="animate-rise motion-reduce:animate-none mt-8 flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase sm:text-xs"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-px w-8 bg-gold/60" />
            Nottingham&rsquo;s No.1 Juice Spot
          </p>

          <h1
            id="hero-heading"
            className="animate-rise motion-reduce:animate-none mt-5"
            style={{ animationDelay: "0.18s" }}
          >
            <span className="text-foil block font-script text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Elevate your day,
            </span>
            <span className="text-foil mt-2 block font-display text-[2rem] leading-[1.05] font-medium tracking-[0.1em] sm:text-5xl lg:text-[3.5rem]">
              THE JC WAY
            </span>
          </h1>

          <p
            className="animate-rise motion-reduce:animate-none mt-6 max-w-md text-[0.9375rem] leading-relaxed font-light text-cream-dim sm:text-base"
            style={{ animationDelay: "0.26s" }}
          >
            Juices, milkshakes and desserts made the morning they go out, then
            driven to your door across {DELIVERY.city}. Nothing sits in a
            warehouse &mdash; there isn&rsquo;t one.
          </p>

          <div
            className="animate-rise motion-reduce:animate-none mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            style={{ animationDelay: "0.34s" }}
          >
            <ButtonLink href="/menu" variant="primary" size="lg">
              Order Now
            </ButtonLink>
            <ButtonLink href="/subscribe" variant="secondary" size="lg">
              Weekly Drops
            </ButtonLink>
          </div>

          <div
            className="animate-rise motion-reduce:animate-none mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-[0.625rem] tracking-[0.14em] text-cream-faint uppercase sm:text-[0.6875rem]"
            style={{ animationDelay: "0.42s" }}
          >
            <span className="numeric">
              Free delivery over {formatPrice(DELIVERY.freeDeliveryThreshold)}
            </span>
            <span className="h-3 w-px bg-ink-line" />
            <span>{DELIVERY.city} only</span>
            <span className="h-3 w-px bg-ink-line" />
            <span>A part of 1K Entrepreneurship</span>
          </div>
        </div>

        {/* ---------- the bottle, in its case ---------- */}
        <div
          className="animate-rise motion-reduce:animate-none relative mx-auto w-full max-w-lg lg:max-w-none"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Glow sits under the frame so the light looks like it comes off
              the product rather than being painted behind it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_50%_45%,rgba(212,166,60,0.30),transparent_62%)] blur-2xl"
          />
          {/* Offset outer rule — the double frame you get on a spirits label. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2.5 rounded-[2px] border border-gold/15 sm:-inset-4"
          />

          <div className="relative rounded-[2px] border border-gold-deep/45 p-2 shadow-lift sm:p-2.5">
            <FoilImage
              src="/brand/hero.jpg"
              alt="A chilled 330ml bottle of Juice Cartel mango juice, freshly pressed"
              accent="#f2a81d"
              priority
              sizes="(max-width: 1023px) 92vw, 520px"
              className="aspect-[16/11] rounded-[1px] sm:aspect-[4/3] lg:aspect-[4/5]"
              markClassName="w-[22%] lg:w-[26%]"
            />

            {/* Reads off the real bottle label. */}
            <div className="absolute -bottom-px left-2 right-2 flex items-center justify-between gap-3 border-t border-gold-deep/30 bg-ink/85 px-3 py-2.5 backdrop-blur-sm sm:left-2.5 sm:right-2.5">
              <span className="font-sans text-[0.625rem] tracking-label text-gold uppercase">
                Freshly Made
              </span>
              <span className="h-3 w-px bg-gold-deep/50" />
              <span className="numeric font-sans text-[0.625rem] tracking-label text-cream-dim uppercase">
                330ml
              </span>
              <span className="h-3 w-px bg-gold-deep/50" />
              <span className="font-sans text-[0.625rem] tracking-label text-cream-faint uppercase">
                {DELIVERY.dropDay} drops
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
