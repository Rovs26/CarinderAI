import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPhp } from "@/lib/currency";
import {
  BackLink,
  DeliveryBadge,
  EmptyMenu,
  MenuHeading,
} from "./CarinderiaDetailChrome";

/**
 * `/customers/[id]` — Tier 2 carinderia detail (Reqs 10.3–10.5).
 *
 * Server Component: reads the carinderia + its menu items via Prisma. All
 * user-facing chrome (back link, delivery badge, menu heading, empty
 * state) is rendered through small client islands in
 * `./CarinderiaDetailChrome.tsx` so it follows the active language toggle
 * via `useT()`.
 */
export default async function CarinderiaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const carinderia = await prisma.carinderia.findUnique({
    where: { id: params.id },
    include: { menuItems: true },
  });

  if (!carinderia) notFound();

  return (
    <div className="pb-24">
      <BackLink />

      <header className="px-4 pt-3">
        <div className="text-5xl">{carinderia.imageUrl}</div>
        <h1 className="text-2xl font-bold text-ink mt-1">{carinderia.name}</h1>
        <p className="text-sm text-muted">{carinderia.topDish}</p>
        <div className="flex items-center gap-3 text-sm text-muted mt-1">
          <span>★ {carinderia.rating.toFixed(1)}</span>
          <span>{carinderia.distanceKm} km</span>
          <span>{carinderia.priceRange}</span>
        </div>
      </header>

      <DeliveryBadge />

      <p className="text-sm text-muted px-4 mt-2">{carinderia.address}</p>

      <MenuHeading />

      {carinderia.menuItems.length === 0 ? (
        <EmptyMenu />
      ) : (
        <ul>
          {carinderia.menuItems.map((item) => (
            <li
              key={item.id}
              className="tap-row justify-between"
            >
              <span className="text-sm text-ink">{item.name}</span>
              <span className="text-sm font-semibold text-primary">
                {formatPhp(item.pricePhp)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
