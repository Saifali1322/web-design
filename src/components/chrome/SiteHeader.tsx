"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoInline } from "@/components/brand/Logo";
import { useCart } from "@/components/cart/CartProvider";

/**
 * Ordered as the buying decision runs: what there is, how to make it yours,
 * how to get it every week, whether we can reach you, and then the two pages
 * somebody reads when they are deciding whether to trust a kitchen they have
 * never been to.
 *
 * The bar opens at lg rather than md. Six items at this letter-spacing need
 * about 880px alongside the logo and the basket; at md they were fitting only
 * by wrapping "Build a Blend" and "Weekly Drops" onto two lines each, which
 * looked like a mistake. Tablets get the same sheet as phones instead.
 */
const nav = [
  { href: "/menu", label: "Menu" },
  { href: "/mixer", label: "Build a Blend" },
  { href: "/subscribe", label: "Weekly Drops" },
  { href: "/delivery", label: "Delivery" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "Questions" },
];

export default function SiteHeader() {
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled || menuOpen
          ? "bg-ink/95 backdrop-blur-md border-b border-ink-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Juice Cartel, home"
          onClick={() => setMenuOpen(false)}
        >
          <LogoInline />
        </Link>

        <nav
          className="hidden items-center gap-6 lg:flex xl:gap-8"
          aria-label="Main navigation"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-label text-cream-dim transition-colors hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            className="relative flex items-center gap-2 border border-gold-dim/60 px-3.5 py-2 text-[0.68rem] font-medium uppercase tracking-label text-gold transition-colors hover:border-gold hover:bg-gold/10"
            aria-label={`Open basket, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M3 6h14l-1.2 10.2a2 2 0 0 1-2 1.8H6.2a2 2 0 0 1-2-1.8Z" />
              <path d="M7 6V4.5a3 3 0 0 1 6 0V6" />
            </svg>
            <span className="hidden sm:inline">Basket</span>
            {count > 0 && (
              <span className="numeric ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold text-ink">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center border border-ink-line text-cream-dim transition-colors hover:border-gold-dim hover:text-gold lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="border-t border-ink-line bg-ink lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col px-5 py-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-ink-line/70 py-3.5 font-display text-lg text-cream transition-colors hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
