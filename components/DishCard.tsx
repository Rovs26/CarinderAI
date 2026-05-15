import type { Dish } from "@/lib/mock-data";
import { getCarinderiaName } from "@/lib/mock-data";
import { formatPeso } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

export function DishCard({ dish, selected }: { dish: Dish; selected?: boolean }) {
  return (
    <article
      className={`card !p-3 transition-all ${selected ? "ring-2 ring-[var(--color-accent)] card-warm" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{dish.name}</h3>
          <p className="truncate text-xs text-[var(--color-muted)]">
            {getCarinderiaName(dish.carinderiaId)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {dish.isBestSeller && (
            <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-medium text-white">
              Best
            </span>
          )}
          <StatusBadge status={dish.availability} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">{dish.description}</p>
      <p className="mt-2 text-base font-semibold text-[var(--color-accent)]">
        {formatPeso(dish.price)}
      </p>
    </article>
  );
}
