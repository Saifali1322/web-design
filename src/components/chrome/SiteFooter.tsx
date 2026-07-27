import Link from "next/link";
import { LogoLockup } from "@/components/brand/Logo";
import { DELIVERY, SOCIALS } from "@/lib/catalogue";

const columns = [
  {
    title: "Order",
    links: [
      { href: "/menu", label: "Full Menu" },
      { href: "/subscribe", label: "Weekly Drops" },
      { href: "/delivery", label: "Delivery Areas" },
    ],
  },
  {
    title: "Know",
    links: [
      { href: "/allergens", label: "Allergens" },
      { href: "/delivery", label: "Minimum Order" },
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
        <div className="flex flex-col items-center gap-4 text-center">
          <LogoLockup size="md" />
          <p className="font-script text-2xl text-gold">Elevate your day</p>
          <p className="text-[0.6rem] uppercase tracking-label text-cream-faint">
            The JC Way
          </p>
        </div>

        <div className="rule-foil my-12" />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="rule-foil my-12" />

        {/* Allergen line is a legal requirement for food sold at distance. */}
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-cream-faint">
          All drinks are freshly made and unpasteurised. Keep refrigerated and
          drink within 3 days. Made in a kitchen that also handles milk, wheat,
          soya and nuts, so we cannot guarantee any item is free from traces.
          Please{" "}
          <Link href="/allergens" className="text-gold underline">
            check the allergen information
          </Link>{" "}
          or message us before ordering if you have a severe allergy.
        </p>

        <div className="mt-10 flex flex-col items-center gap-2 text-[0.65rem] uppercase tracking-label text-cream-faint">
          <p>juicecartel.uk</p>
          <p>A part of 1K Entrepreneurship</p>
          <p>
            © {new Date().getFullYear()} Juice Cartel · {DELIVERY.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
