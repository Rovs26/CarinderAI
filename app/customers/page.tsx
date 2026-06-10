import { prisma } from "@/lib/prisma";
import { getFeaturedDishes } from "@/lib/discovery";
import { CustomersHeader } from "./CustomersHeader";
import { DiscoveryView } from "./DiscoveryView";

/**
 * `/customers` — Tier 2 Customer Browse, now a Grab-style food discovery
 * surface (Reqs 10.1, 10.2 + extension).
 *
 * Server Component: fetches the carinderia list and the featured-dish set
 * in parallel via `Promise.all`. Both data shapes are JSON-serializable
 * and cross the RSC boundary into `DiscoveryView` (a client component) that
 * owns search state.
 */
export default async function CustomersPage() {
  const [carinderias, featured] = await Promise.all([
    prisma.carinderia.findMany({ orderBy: { distanceKm: "asc" } }),
    getFeaturedDishes(6),
  ]);

  return (
    <main className="flex flex-col">
      <CustomersHeader />
      <DiscoveryView carinderias={carinderias} featuredDishes={featured} />
    </main>
  );
}
