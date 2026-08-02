import Link from "next/link";
import { LogoLockup } from "@/components/brand/Logo";
import { DELIVERY, SOCIALS, juices } from "@/lib/catalogue";

/**
 * The shelf-life figure in the notice below is legally load-bearing, so it is
 * read off the catalogue rather than typed. Shortening a recipe's `keepsDays`
 * must never leave a longer, safer-sounding number sitting in the footer of
 * every page on the site.
 */
const JUICE_KEEPS = Math.min(...juices.map((juice) => juice.keepsDays));

/**
 * Two columns, split by intent rather than by page type. "Order" is everything
 * that leads to a basket. "Know" is everything somebody reads before they are
 * willing to fill one, which is where About and FAQ belong: they exist to
 * answer the questions that stop a first order.
 */
const columns = [
  {
    title: "Order",
    links: [
      { href: "/menu", label: "Full Menu" },
      { href: "/mixer", label: "Build a Blend" },
      { href: "/subscribe", label: "Weekly Drops" },
    ],
  },
  {
    title: "Know",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/faq", label: "Questions" },
      { href: "/delivery", label: "Delivery & Minimums" },
      { href: "/allergens", label: "Allergens" },
    ],
  },
];

const socials = [
  { href: SOCIALS.tiktok, label: "TikTok" },
  { href: SOCIALS.instagram, label: "Instagram" },
  { href: SOCIALS.snapchat, label: "Snapchat" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-line bg-ink-raised">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        {/* The masthead used to be a centred stack, which is what every footer
            on the internet does. It is a baseline row instead: identity on the
            left, the phone on the right, because the number reaching a person
            is one of the few things this business has that a bigger one does
            not. */}
        <div className="flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div>
            <LogoLockup size="md" />
            <p className="mt-4 font-script text-2xl leading-none text-gold">
              Pressed the morning it reaches you
            </p>
            <p className="mt-2.5 text-[0.6rem] uppercase tracking-label text-cream-faint">
              The JC Way
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-[0.6rem] uppercase tracking-label text-cream-faint">
              Ring the kitchen
            </p>
            <a
              href={`tel:${SOCIALS.phone}`}
              className="numeric mt-2.5 block font-display text-2xl leading-none text-gold transition-colors hover:text-gold-bright"
            >
              {SOCIALS.phone}
            </a>
          </div>
        </div>

        {/* Deliberately not the symmetrical fading rule used elsewhere: a short
            gold tick against a long hairline, weighted to the left. */}
        <div className="my-12 flex items-center" aria-hidden="true">
          <span className="h-px w-20 shrink-0 bg-gold/70 sm:w-28" />
          <span className="h-px flex-1 bg-ink-line" />
        </div>

        {/* Four columns, not four equal columns. The two link lists are short
            words; the postcode block is eleven codes and wants the room. */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[0.8fr_0.95fr_1.05fr_1.2fr] lg:gap-12">
          {columns.map((col) => (
            <nav key={col.title} aria-labelledby={`footer-${col.title}`}>
              <h2
                id={`footer-${col.title}`}
                className="mb-4 text-[0.6rem] uppercase tracking-label text-gold"
              >
                {col.title}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-dim transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="mb-4 text-[0.6rem] uppercase tracking-label text-gold">
              Follow
            </h2>
            <ul className="flex flex-col gap-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cream-dim transition-colors hover:text-gold"
                  >
                    {s.label}{" "}
                    <span className="text-cream-faint">{SOCIALS.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-[0.6rem] uppercase tracking-label text-gold">
              Delivering to
            </h2>
            <p className="text-sm leading-relaxed text-cream-dim">
              {DELIVERY.city}
              <br />
              <span className="numeric text-cream-faint">
                {DELIVERY.postcodes.join(" · ")}
              </span>
            </p>
            <p className="mt-3 text-xs text-cream-faint">
              Weekly drops every {DELIVERY.dropDay}.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-ink-line pt-8" />

        {/* Allergen line is a legal requirement for food sold at distance. It
            is set left at a reading measure rather than centred: small print
            that has to be read is not a decorative flourish. */}
        <p className="max-w-2xl text-xs leading-relaxed text-cream-faint">
          All drinks are freshly made and unpasteurised. Keep refrigerated and
          drink within {JUICE_KEEPS}{" "}
          days. Everything comes out of one kitchen
          that also handles milk, wheat, soya and nuts, so no item can be
          guaranteed free from traces. Please{" "}
          <Link href="/allergens" className="text-gold underline">
            check the allergen information
          </Link>{" "}
          or message us before ordering if you have a severe allergy. More on{" "}
          <Link href="/faq#allergens" className="text-gold underline">
            allergens and food safety
          </Link>
          .
        </p>

        <div className="mt-10 flex flex-col gap-2 text-[0.65rem] uppercase tracking-label text-cream-faint sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <p>
            juicecartel.uk · © {new Date().getFullYear()}{" "}
            Juice Cartel ·{" "}
            {DELIVERY.city}
          </p>
          <p>A part of 1K Entrepreneurship</p>
        </div>
      </div>
    </footer>
  );
}
