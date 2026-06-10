import { prisma } from "@/lib/prisma";
import { MarketView } from "./MarketView";

/**
 * `/market` — Tier 1 Logistics surface (Req 2).
 *
 * Server Component: fetches Suppliers and Products from Prisma, then passes
 * plain JSON-friendly arrays into the `MarketView` client island that owns
 * the category-chip and supplier-pill filter state.
 *
 * No Date columns are read here, so the props serialize cleanly across the
 * RSC → client boundary.
 */
export default async function MarketPage() {
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <MarketView
      suppliers={suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl,
        category: s.category,
      }))}
      products={products.map((p) => ({
        id: p.id,
        supplierId: p.supplierId,
        name: p.name,
        category: p.category,
        unit: p.unit,
        pricePhp: p.pricePhp,
        stock: p.stock,
        imageUrl: p.imageUrl,
      }))}
    />
  );
}
