import { ButtonLink } from "@/components/ui/Button";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import { categoryLabel, products, type Category } from "@/lib/catalogue";

/**
 * Menu counts are derived so the closing line can never drift from the
 * catalogue. A new flavour changes the sentence without anyone editing it.
 */
const COUNT_ORDER: Category[] = ["juice", "fuel", "bake"];

const NOUN: Record<Category, [string, string]> = {
  juice: ["juice", "juices"],
  fuel: ["protein shake", "protein shakes"],
  bake: ["bake", "bakes"],
};

/** "a, b and c", never "a and b and c". */
function listSentence(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function menuSummary(): string {
  return listSentence(
    COUNT_ORDER.map((category) => {
      const n = products.filter((p) => p.category === category).length;
      return `${n} ${NOUN[category][n === 1 ? 0 : 1]}`;
    }).filter((part) => !part.startsWith("0 ")),
  );
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
      className="relative border-t border-ink-line py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        {/* Heading and the sentence that defines the claim sit on one baseline
            rather than stacking, so this section opens differently from the one
            above it. "Bestseller" is a claim, so it gets defined: an undefined
            badge is the sort of thing a cheap site does constantly. */}
        <Reveal>
          <div className="grid gap-x-14 gap-y-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2
                id="bestsellers-heading"
                className="text-foil font-display text-3xl leading-none font-medium tracking-[0.06em] sm:text-4xl lg:text-5xl"
              >
                BESTSELLERS
              </h2>
              <p className="mt-3 font-script text-2xl leading-none text-gold/85 sm:text-3xl">
                the ones that go first
              </p>
            </div>

            <p className="max-w-2xl text-[0.9375rem] leading-relaxed font-light text-cream-dim lg:pb-1">
              Not a badge handed out at random. These are the{" "}
              {bestsellers.length}{" "}
              that go first every week, and the press list gets built around
              them before anything else is added to it. They run across{" "}
              {listSentence(categories)}.
            </p>
          </div>
        </Reveal>

        {/* Five cards in a three-up leaves a card-shaped hole in the last row.
            The note goes in it: same grid, different object, and the section no
            longer needs a separate footer band to carry the link out. */}
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {bestsellers.map((product, index) => (
            <Reveal as="li" key={product.id} delay={index * 0.09} className="flex">
              <ProductCard product={product} className="w-full" />
            </Reveal>
          ))}

          <Reveal as="li" delay={bestsellers.length * 0.09} className="flex">
            <div className="flex w-full flex-col justify-between gap-8 border border-ink-line bg-ink-card/50 p-7 sm:p-8">
              <div>
                <p className="font-script text-3xl leading-none text-gold/85">
                  and the rest
                </p>
                <p className="mt-5 text-sm leading-relaxed font-light text-cream-dim">
                  {menuSummary()} on the full menu, every one of them with its
                  ingredients, its allergens and its own date written out.
                  {seasonal.length > 0 && (
                    <>
                      {" "}
                      {seasonal.map((product) => product.name).join(" and ")}{" "}
                      {seasonal.length === 1 ? "is" : "are"} seasonal and{" "}
                      {seasonal.length === 1 ? "comes" : "come"} off the list
                      when the fruit stops being worth pressing.
                    </>
                  )}
                </p>
              </div>

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
        </ul>
      </div>
    </section>
  );
}

export default Bestsellers;
