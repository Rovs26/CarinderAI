"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DishCard } from "@/components/DishCard";
import { carinderias, dishes, getCarinderiaName, type Dish } from "@/lib/mock-data";
import { formatPeso } from "@/lib/utils";

export default function DiscoverPage() {
  const [selectedCarinderiaId, setSelectedCarinderiaId] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [soldOutMessage, setSoldOutMessage] = useState<string | null>(null);

  const visibleDishes = useMemo(() => {
    if (!selectedCarinderiaId) return dishes;
    return dishes.filter((d) => d.carinderiaId === selectedCarinderiaId);
  }, [selectedCarinderiaId]);

  const selectedCarinderia = selectedCarinderiaId
    ? carinderias.find((c) => c.id === selectedCarinderiaId)
    : null;

  const handleDishSelect = (dish: Dish) => {
    if (dish.availability === "sold_out") {
      setSoldOutMessage("This dish is sold out today.");
      setSelectedDish(null);
      return;
    }
    setSoldOutMessage(null);
    setSelectedDish(dish);
    setSelectedCarinderiaId(dish.carinderiaId);
  };

  return (
    <AppShell title="Discover" subtitle="Nearby carinderias (demo)">
      {soldOutMessage && (
        <p className="mb-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          {soldOutMessage}
        </p>
      )}

      {selectedDish && (
        <article className="card-warm card mb-4">
          <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">Selected</p>
          <h3 className="mt-1 font-semibold">{selectedDish.name}</h3>
          <p className="text-sm text-[var(--color-muted)]">
            {getCarinderiaName(selectedDish.carinderiaId)} · {formatPeso(selectedDish.price)}
          </p>
          <p className="mt-2 text-sm">{selectedDish.description}</p>
          <button
            type="button"
            onClick={() => setSelectedDish(null)}
            className="btn-ghost mt-3 text-xs"
          >
            Clear selection
          </button>
        </article>
      )}

      {selectedCarinderia && !selectedDish && (
        <article className="card-warm card mb-4">
          <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">Selected</p>
          <h3 className="mt-1 font-semibold">{selectedCarinderia.name}</h3>
          <p className="text-sm text-[var(--color-muted)]">{selectedCarinderia.location}</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {selectedCarinderia.distanceKm} km · ★{selectedCarinderia.rating}
          </p>
          <button
            type="button"
            onClick={() => setSelectedCarinderiaId(null)}
            className="btn-ghost mt-3 text-xs"
          >
            Show all dishes
          </button>
        </article>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">Nearby</h2>
        <ul className="space-y-2">
          {carinderias.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedCarinderiaId(c.id);
                  setSelectedDish(null);
                  setSoldOutMessage(null);
                }}
                className={`card flex w-full items-center justify-between gap-2 !py-3 text-left active:scale-[0.99] ${
                  selectedCarinderiaId === c.id ? "ring-2 ring-[var(--color-accent)] card-warm" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm">{c.name}</p>
                  <p className="truncate text-xs text-[var(--color-muted)]">{c.location}</p>
                </div>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {c.distanceKm} km · ★{c.rating}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
          Dishes{selectedCarinderiaId ? ` · ${getCarinderiaName(selectedCarinderiaId)}` : ""}
        </h2>
        {visibleDishes.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No dishes for this carinderia.</p>
        ) : (
          <ul className="space-y-3">
            {visibleDishes.map((dish) => {
              const soldOut = dish.availability === "sold_out";
              return (
                <li key={dish.id}>
                  <button
                    type="button"
                    onClick={() => handleDishSelect(dish)}
                    className={`w-full text-left ${soldOut ? "cursor-not-allowed opacity-60" : ""}`}
                    aria-disabled={soldOut}
                  >
                    <DishCard dish={dish} selected={selectedDish?.id === dish.id} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
