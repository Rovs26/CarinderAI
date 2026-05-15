import { AppShell } from "@/components/AppShell";
import { DishCard } from "@/components/DishCard";
import { carinderias, dishes } from "@/lib/mock-data";

export default function DiscoverPage() {
  return (
    <AppShell title="Discover" subtitle="Nearby carinderias">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">Nearby</h2>
        <ul className="space-y-2">
          {carinderias.map((c) => (
            <li key={c.id} className="card flex items-center justify-between gap-2 !py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-sm">{c.name}</p>
                <p className="truncate text-xs text-[var(--color-muted)]">{c.location}</p>
              </div>
              <span className="shrink-0 text-xs text-[var(--color-muted)]">
                {c.distanceKm} km · ★{c.rating}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">Dishes</h2>
        <ul className="space-y-3">
          {dishes.map((dish) => (
            <li key={dish.id}>
              <DishCard dish={dish} />
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
