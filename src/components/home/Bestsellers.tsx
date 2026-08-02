import { ButtonLink } from "@/components/ui/Button";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import { categoryLabel, products, type Category } from "@/lib/catalogue";

/**
 * Menu counts are derived so the closing line can never drift from the
 * catalogue — a new flavour changes the sentence without anyone editing it.
 */
const COUNT_ORDER: Category[] = ["juice", "fuel", "bake"];

const NOUN: Record<Category, [string, string]> = {
  juice: ["juice", "juices"],
  fuel: ["protein shake", "protein shakes"],
  bake: ["bake", "bakes"],
};

function menuSummary(): string {
  const parts = COUNT_ORDER.map((category) => {
    const n = products.filter((p) => p.category === category).length;
    return `${n} ${NOUN[category][n === 1 ? 0 : 1]}`;
  }).filter((part) => !part.startsWith("0 "));

  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function Bestsellers() {
  const bestsellers = products.filter((product) => product.bestseller);

  if (bestsellers.length === 0) return null;

  const seasonal = bestsellers.filter((product) => product.seasonal);
  const categories = [
    ...new Set(bestsellers.map((product) => categoryLabel[product.category])),
  ];

  return (
    <section
      aria-labelledby="bestsellers-heading"
      className="relative border-t border-ink-line py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Header sits on a baseline with the link, not stacked and centred. */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div>
              <p className="flex items-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase">
                <span className="h-px w-8 bg-gold/60" />
                The shortlist
              </p>
              <h2
                id="bestsellers-heading"
                className="text-foil mt-4 font-display text-3xl leading-none font-medium tracking-[0.06em] sm:text-4xl lg:text-5xl"
              >
                BESTSELLERS
              </h2>
              <p className="mt-3 font-script text-2xl leading-none text-gold/85 sm:text-3xl">
                the ones that go first
              </p>
            </div>

            <ButtonLink href="/menu" variant="ghost" size="sm" className="-mb-1">
              See the full menu
            </ButtonLink>
          </div>
        </Reveal>

        {/* "Bestseller" is a claim, so it gets defined rather than left as a
            badge — an undefined badge is the sort of thing a good site does not
            do and a cheap one does constantly. */}
        <Reveal delay={0.04}>
          <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed font-light text-cream-dim">
            Not a badge handed out at random. These are the{" "}
            {bestsellers.length} that go first every week — the ones the press
            list gets built around before anything else is added to it, across{" "}
            {categories.join(" and ")}.
          </p>
        </Reveal>

        <div className="rule-foil mt-9 mb-10 sm:mt-10 sm:mb-12" />

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {bestsellers.map((product, index) => (
            <Reveal
              as="li"
              key={product.id}
              delay={index * 0.09}
              className="flex"
            >
              <ProductCard product={product} className="w-full" />
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.05}>
          <div className="mt-10 flex flex-col gap-4 border-t border-ink-line pt-7 sm:mt-12 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
            <p className="max-w-xl text-sm leading-relaxed font-light text-cream-faint">
              {menuSummary()} on the full menu, every one of them with its
              ingredients and allergens written out.
              {seasonal.length > 0 && (
                <>
                  {" "}
                  {seasonal.map((product) => product.name).join(" and ")}{" "}
                  {seasonal.length === 1 ? "is" : "are"} seasonal, and{" "}
                  {seasonal.length === 1 ? "comes" : "come"} off the menu when
                  the fruit stops being worth pressing.
                </>
              )}
            </p>

            <ButtonLink
              href="/menu"
              variant="secondary"
              size="md"
              className="self-start whitespace-nowrap"
            >
              Browse everything
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default Bestsellers;
