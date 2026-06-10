"use client";

export interface CategoryChipRowProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

/**
 * Horizontal scrolling row of category chips used on `/market` to filter
 * products. The consumer owns the category list — typically `["All", "Meat
 * & Eggs", "Fish", "Vegetables", "Condiments", "Rice/Grains"]` — and the
 * active chip state.
 *
 * The active chip uses the brand `primary` orange; inactive chips sit on a
 * `cream` background so the whole row blends with the app's warm palette.
 */
export function CategoryChipRow({
  categories,
  active,
  onSelect,
}: CategoryChipRowProps) {
  return (
    <div className="flex gap-2 overflow-x-auto whitespace-nowrap py-3">
      {categories.map((category) => {
        const isActive = category === active;
        const base =
          "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:ring-1 hover:ring-primary/30";
        const tone = isActive ? "pill pill-active" : "pill";
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(category)}
            className={`${base} ${tone}`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
