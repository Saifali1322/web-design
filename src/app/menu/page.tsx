import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY, formatPrice, products } from "@/lib/catalogue";
import MenuGrid from "@/components/menu/MenuGrid";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Cold pressed juices, milkshakes, desserts and shots — pressed and made fresh, delivered every Sunday across Nottingham. Full ingredients and allergens for every item.",
};

export default function MenuPage() {
  return (
    <div className="bg-grain">
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 sm:pt-20">
        <p className="tracking-label text-xs uppercase text-gold">
          The Full Menu
        </p>
        <h1 className="mt-3 font-display text-4xl text-foil sm:text-5xl">
          Fresh, pressed, delivered
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream-dim sm:text-base">
          Every bottle is 330ml, made the morning it goes out. No concentrate,
          no shortcuts. Add anything below to your basket, or see the{" "}
          <Link href="/subscribe" className="text-gold underline underline-offset-2">
            weekly subscription
          </Link>{" "}
          if you want it sorted every Sunday without thinking about it.
        </p>

        <div className="mt-8 flex flex-col gap-3 border border-ink-line bg-ink-card px-5 py-4 sm:flex-row sm:items-center sm:gap-8">
          <p className="text-sm text-cream-dim">
            Minimum order{" "}
            <span className="numeric font-medium text-gold-bright">
              {formatPrice(DELIVERY.minimumOrder)}
            </span>
          </p>
          <div className="hidden h-4 w-px bg-ink-line sm:block" />
          <p className="text-sm text-cream-dim">
            Free delivery over{" "}
            <span className="numeric font-medium text-gold-bright">
              {formatPrice(DELIVERY.freeDeliveryThreshold)}
            </span>
          </p>
          <div className="hidden h-4 w-px bg-ink-line sm:block" />
          <p className="text-sm text-cream-dim">
            Delivering across {DELIVERY.city} every{" "}
            <Link href="/delivery" className="text-gold underline underline-offset-2">
              {DELIVERY.dropDay}
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <MenuGrid products={products} />
      </section>
    </div>
  );
}
