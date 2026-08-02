import type { Metadata } from "next";
import Link from "next/link";
import { BottleMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import Reveal, { revealNoScriptCss } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** Where people actually meant to go. A dead end should still sell. */
const routes = [
  { href: "/menu", label: "The full menu", note: "Juices, shakes and bakes" },
  { href: "/mixer", label: "Build a blend", note: "Pick your own four fruits" },
  { href: "/subscribe", label: "Weekly drops", note: "The same box, every Sunday" },
  { href: "/delivery", label: "Delivery", note: "Areas, days and thresholds" },
];

/**
 * A 404 is the one page nobody designs and everybody eventually sees. This
 * one arrives in sequence rather than all at once — mark, number, rule,
 * headline, actions — which is the same vocabulary the rest of the site
 * uses, so it reads as part of the shop rather than as the server's apology.
 */
export default function NotFound() {
  return (
    <>
      <noscript>
        <style>{revealNoScriptCss}</style>
      </noscript>

      <section className="bg-grain mx-auto flex min-h-[78vh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
        <Reveal variant="fade">
          <BottleMark className="h-14 w-auto text-gold-deep" />
        </Reveal>

        {/* Set as display type, not as an error code. */}
        <Reveal variant="settle" delay={0.08} className="mt-8">
          <p className="numeric font-display text-6xl text-foil sm:text-7xl">
            404
          </p>
        </Reveal>

        <Reveal variant="rule" delay={0.24} className="mt-7 w-40">
          <div className="rule-foil" />
        </Reveal>

        <Reveal variant="rise" delay={0.3} className="mt-7">
          <h1 className="font-display text-3xl tracking-wide text-cream sm:text-4xl">
            This one&apos;s sold out
          </h1>
          <p className="measure-tight mx-auto mt-4 text-sm leading-relaxed text-cream-dim sm:text-base">
            The page you were after isn&apos;t here. The juice, however, very
            much is.
          </p>
        </Reveal>

        <Reveal variant="rise" delay={0.4} className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/menu" variant="primary" size="lg">
              See the Menu
            </ButtonLink>
            <ButtonLink href="/" variant="secondary" size="lg">
              Back Home
            </ButtonLink>
          </div>
        </Reveal>

        {/* Rather than dead-ending, hand over the four places worth going. */}
        <Reveal variant="fade" delay={0.52} className="mt-16 w-full">
          <h2 className="text-2xs tracking-label text-cream-faint uppercase">
            Or pick up where you left off
          </h2>
          {/* gap-px over a line-coloured ground draws the grid's rules for
              free, so there are no borders to double up at the seams. */}
          <ul className="mt-5 grid gap-px overflow-hidden rounded-[2px] border border-ink-line bg-ink-line sm:grid-cols-2">
            {routes.map((route) => (
              <li key={route.href} className="bg-ink-card">
                <Link
                  href={route.href}
                  className="card-motion group flex h-full flex-col items-start gap-1 px-5 py-4 text-left hover:bg-ink-raised"
                >
                  <span className="font-display text-lg text-cream transition-colors duration-300 group-hover:text-gold-bright">
                    {route.label}
                  </span>
                  <span className="text-xs text-cream-faint">{route.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </>
  );
}
