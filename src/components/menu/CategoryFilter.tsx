"use client";

import { categoryLabel, type Category } from "@/lib/catalogue";

export type CategoryFilterValue = "all" | Category;

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: CategoryFilterValue;
  onSelect: (value: CategoryFilterValue) => void;
}) {
  const options: { value: CategoryFilterValue; label: string }[] = [
    { value: "all", label: "Everything" },
    ...categories.map((c) => ({ value: c, label: categoryLabel[c] })),
  ];

  return (
    <div
      role="group"
      aria-label="Filter menu by category"
      className="flex flex-wrap gap-2.5"
    >
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(opt.value)}
            className={`border px-4 py-2 text-[0.68rem] font-medium uppercase tracking-label transition-colors ${
              active
                ? "border-gold bg-gold/10 text-gold-bright"
                : "border-ink-line text-cream-dim hover:border-gold-dim hover:text-gold"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
