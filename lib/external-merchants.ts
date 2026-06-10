/**
 * External Merchants — informal nearby vendors a carinderia owner can fall
 * back on when the formal Suppliers' 5am cutoff has passed and they need
 * to top up mid-day.
 *
 * Hardcoded fixture, NOT a Prisma table. The data shape mimics what a
 * real geolocation + merchant directory would surface, but every field
 * is static. Distances are labels, not computed; "Reserve" and "Get
 * directions" do not actually do anything beyond firing a toast in the
 * UI. The demo is explicit about this — see /market `Nearby` tab.
 */

export type MerchantCategory =
  | "palengke"
  | "sari-sari"
  | "neighbor"
  | "wet-market";

export interface ExternalMerchant {
  id: string;
  name: string;
  category: MerchantCategory;
  /** Static, e.g. "0.3 km away". Not derived from real geolocation. */
  distanceLabel: string;
  /** Used for the "nearest" sort. */
  walkingMinutes: number;
  /** 1 = cheapest, 3 = priciest. Used for the "cheapest" sort. */
  priceLevel: 1 | 2 | 3;
  /** Free-form Filipino product names — display only, no matcher hookup. */
  availableItems: string[];
  /** When false, the row hides the "Reserve" CTA and shows a walk-in pill. */
  acceptsOrders: boolean;
  /** Short context line ("Ask for Aling Marites", "Walk-in only", etc.). */
  contactHint: string;
  /** Single emoji used as visual identifier in the feed row. */
  emoji: string;
  /** Display-only star rating, 4.0–5.0. */
  rating: number;
}

export const EXTERNAL_MERCHANTS: ExternalMerchant[] = [
  {
    id: "aling-marites-veggies",
    name: "Aling Marites' Gulayan",
    category: "palengke",
    distanceLabel: "0.3 km away",
    walkingMinutes: 4,
    priceLevel: 1,
    availableItems: ["Sibuyas", "Bawang", "Kamatis", "Talong", "Kangkong"],
    acceptsOrders: true,
    contactHint: "Ask for Aling Marites — usually has stock until 7pm",
    emoji: "🥬",
    rating: 4.7,
  },
  {
    id: "mang-jun-meat",
    name: "Mang Jun's Meat Stall",
    category: "palengke",
    distanceLabel: "0.5 km away",
    walkingMinutes: 7,
    priceLevel: 2,
    availableItems: ["Pork belly", "Pork shoulder", "Ground beef"],
    acceptsOrders: true,
    contactHint: "Cuts to order, call ahead for ground meat",
    emoji: "🥩",
    rating: 4.5,
  },
  {
    id: "lola-pacing-fish",
    name: "Lola Pacing's Fresh Catch",
    category: "wet-market",
    distanceLabel: "0.7 km away",
    walkingMinutes: 9,
    priceLevel: 2,
    availableItems: ["Bangus", "Tilapia", "Galunggong"],
    acceptsOrders: false,
    contactHint: "Walk-in only — best stock arrives 5am-10am",
    emoji: "🐟",
    rating: 4.8,
  },
  {
    id: "tindahan-ni-aling-rose",
    name: "Tindahan ni Aling Rose",
    category: "sari-sari",
    distanceLabel: "0.2 km away",
    walkingMinutes: 3,
    priceLevel: 3,
    availableItems: ["Itlog", "Mantika", "Toyo", "Suka", "Asin", "Paminta"],
    acceptsOrders: true,
    contactHint: "Higher prices but stocks emergency basics",
    emoji: "🏪",
    rating: 4.3,
  },
  {
    id: "kuya-noel-rice",
    name: "Kuya Noel's Rice Depot",
    category: "palengke",
    distanceLabel: "1.1 km away",
    walkingMinutes: 14,
    priceLevel: 1,
    availableItems: ["Kanin/Bigas", "Mais", "Munggo"],
    acceptsOrders: true,
    contactHint: "Bulk rice at ₱48/kg — bring your own sack",
    emoji: "🍚",
    rating: 4.6,
  },
  {
    id: "ate-grace-neighbor",
    name: "Ate Grace (kapitbahay)",
    category: "neighbor",
    distanceLabel: "0.1 km away",
    walkingMinutes: 2,
    priceLevel: 2,
    availableItems: ["Itlog", "Sibuyas", "Kamatis"],
    acceptsOrders: true,
    contactHint: "Sells extras from her own kitchen — text first",
    emoji: "🏠",
    rating: 4.9,
  },
  {
    id: "palengke-coop",
    name: "Palengke Coop Stall #12",
    category: "wet-market",
    distanceLabel: "0.9 km away",
    walkingMinutes: 11,
    priceLevel: 1,
    availableItems: ["Pechay", "Sitaw", "Kalabasa", "Atsuete", "Laurel"],
    acceptsOrders: false,
    contactHint: "Walk-in only — cooperative pricing",
    emoji: "🥕",
    rating: 4.4,
  },
  {
    id: "condiment-corner",
    name: "Condiment Corner",
    category: "sari-sari",
    distanceLabel: "0.4 km away",
    walkingMinutes: 5,
    priceLevel: 3,
    availableItems: ["Patis", "Gatas", "Laurel", "Atsuete"],
    acceptsOrders: true,
    contactHint: "Specialty seasonings, slightly above palengke prices",
    emoji: "🧂",
    rating: 4.2,
  },
];

export function getMerchantsByDistance(): ExternalMerchant[] {
  return [...EXTERNAL_MERCHANTS].sort(
    (a, b) => a.walkingMinutes - b.walkingMinutes,
  );
}

export function getMerchantsByPrice(): ExternalMerchant[] {
  return [...EXTERNAL_MERCHANTS].sort((a, b) => a.priceLevel - b.priceLevel);
}
