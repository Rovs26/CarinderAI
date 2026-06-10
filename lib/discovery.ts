import { prisma } from "@/lib/prisma";

/**
 * Discovery helpers for `/customers` — Grab Food-style food search and
 * "Featured today" surfacing.
 *
 * Both helpers are server-side only. They join Carinderia + MenuItem in
 * application code (Prisma `include`) rather than via raw SQL because the
 * fixture is small (4 carinderias, ~20 menu items total) so the cost of
 * sorting/filtering in JS is negligible.
 *
 * `searchDiscovery` is reused by the GET /api/discovery/search route which
 * the client polls with a 300ms debounce.
 */

export interface FeaturedDish {
  menuItemId: string;
  dishName: string;
  pricePhp: number;
  carinderiaId: string;
  carinderiaName: string;
  carinderiaRating: number;
  carinderiaDistanceKm: number;
  carinderiaImageUrl: string;
}

export interface SearchResult {
  type: "carinderia" | "dish";
  carinderiaId: string;
  carinderiaName: string;
  carinderiaRating: number;
  carinderiaDistanceKm: number;
  carinderiaImageUrl: string;
  // Only populated when type === 'dish'.
  dishName?: string;
  dishPricePhp?: number;
  menuItemId?: string;
}

/**
 * Top-rated carinderias' menu items, sorted by carinderia rating (desc)
 * then dish price (asc) so cheaper standouts surface first.
 */
export async function getFeaturedDishes(limit = 6): Promise<FeaturedDish[]> {
  const carinderias = await prisma.carinderia.findMany({
    orderBy: { rating: "desc" },
    include: { menuItems: true },
  });

  const dishes: FeaturedDish[] = [];
  for (const c of carinderias) {
    for (const m of c.menuItems) {
      dishes.push({
        menuItemId: m.id,
        dishName: m.name,
        pricePhp: m.pricePhp,
        carinderiaId: c.id,
        carinderiaName: c.name,
        carinderiaRating: c.rating,
        carinderiaDistanceKm: c.distanceKm,
        carinderiaImageUrl: c.imageUrl,
      });
    }
  }

  dishes.sort((a, b) => {
    if (b.carinderiaRating !== a.carinderiaRating) {
      return b.carinderiaRating - a.carinderiaRating;
    }
    return a.pricePhp - b.pricePhp;
  });

  return dishes.slice(0, limit);
}

/**
 * Case-insensitive substring search across carinderia names + their
 * `topDish` field, then across all menu item names. Carinderia matches
 * are returned first, then dish matches with carinderia context attached
 * so the UI can render either kind of row from the same list.
 *
 * Empty / whitespace-only queries return an empty list (no error).
 */
export async function searchDiscovery(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const carinderias = await prisma.carinderia.findMany({
    include: { menuItems: true },
    orderBy: { distanceKm: "asc" },
  });

  const results: SearchResult[] = [];

  for (const c of carinderias) {
    if (
      c.name.toLowerCase().includes(q) ||
      c.topDish.toLowerCase().includes(q)
    ) {
      results.push({
        type: "carinderia",
        carinderiaId: c.id,
        carinderiaName: c.name,
        carinderiaRating: c.rating,
        carinderiaDistanceKm: c.distanceKm,
        carinderiaImageUrl: c.imageUrl,
      });
    }
  }

  for (const c of carinderias) {
    for (const m of c.menuItems) {
      if (m.name.toLowerCase().includes(q)) {
        results.push({
          type: "dish",
          carinderiaId: c.id,
          carinderiaName: c.name,
          carinderiaRating: c.rating,
          carinderiaDistanceKm: c.distanceKm,
          carinderiaImageUrl: c.imageUrl,
          dishName: m.name,
          dishPricePhp: m.pricePhp,
          menuItemId: m.id,
        });
      }
    }
  }

  return results;
}
