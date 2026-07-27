import { allergenLabel, type Allergen } from "@/lib/catalogue";

/**
 * A single allergen pill, used on menu cards. Small and legible rather than
 * decorative — this is food-safety information, not a design flourish.
 */
export default function AllergenBadge({ allergen }: { allergen: Allergen }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold-dim/60 bg-ink-raised px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-label text-gold-bright">
      {allergenLabel[allergen]}
    </span>
  );
}

/** Renders a full allergen row for a product, or an honest "none" note. */
export function AllergenBadgeList({ allergens }: { allergens: Allergen[] }) {
  if (allergens.length === 0) {
    return (
      <p className="text-xs text-cream-faint">
        No allergens from our tracked list in this recipe.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-cream-faint">Contains:</span>
      {allergens.map((a) => (
        <AllergenBadge key={a} allergen={a} />
      ))}
    </div>
  );
}
