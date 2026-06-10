import { prisma } from "@/lib/prisma";
import { ScanView } from "./ScanView";
import type { MatcherProduct } from "@/lib/matcher";

/**
 * `/scan` — Tier 1 OCR surface (Reqs 6.x, 8.x).
 *
 * Server Component: fetches the seeded Product list once via Prisma and
 * passes only the fields the client matcher and cart need into the
 * `ScanView` client island. The Fuse.js index is built inside `ScanView`
 * with `useMemo` so it is constructed exactly once per render of the
 * page rather than on every keystroke.
 *
 * Mirrors the same RSC + props pattern used by `/market` (see
 * `app/market/page.tsx` and `MarketView`).
 */
export default async function ScanPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const matcherProducts: MatcherProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    unit: p.unit,
    pricePhp: p.pricePhp,
    imageUrl: p.imageUrl,
  }));

  return <ScanView products={matcherProducts} />;
}
