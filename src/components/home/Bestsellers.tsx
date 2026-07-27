import { ButtonLink } from "@/components/ui/Button";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import { products } from "@/lib/catalogue";

export function Bestsellers() {
  const bestsellers = products.filter((product) => product.bestseller);

  if (bestsellers.length === 0) return null;

  return (
    <section
      aria-labelledby="bestsellers-heading"
      className="relative py-20 sm:py-28 lg:py-32"
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

        <div className="rule-foil mt-8 mb-10 sm:mt-10 sm:mb-12" />

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
      </div>
    </section>
  );
}

export default Bestsellers;
