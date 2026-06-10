/**
 * Tray Tally menu — the constrained set of dishes the GPT-4o vision API
 * is allowed to recognize, and the canonical names + prices used by both
 * the API route and the UI.
 *
 * Both `/api/tray` (system prompt) and `app/tray-tally/page.tsx` (UI)
 * import from here so the menu lives in exactly one place.
 */
export const TRAY_MENU = [
  {
    id: "adobo",
    name: "Adobo",
    pricePhp: 65,
    emoji: "🍖",
    description: "Soy-vinegar braised pork or chicken, dark brown",
  },
  {
    id: "sinigang",
    name: "Sinigang",
    pricePhp: 80,
    emoji: "🍲",
    description: "Sour tamarind soup with meat and vegetables, clear broth",
  },
  {
    id: "kare-kare",
    name: "Kare-kare",
    pricePhp: 90,
    emoji: "🥘",
    description: "Peanut-sauce oxtail stew, thick orange-brown sauce",
  },
  {
    id: "pinakbet",
    name: "Pinakbet",
    pricePhp: 55,
    emoji: "🥬",
    description: "Mixed vegetables (eggplant, okra, squash) sautéed",
  },
  {
    id: "lechon-kawali",
    name: "Lechon Kawali",
    pricePhp: 95,
    emoji: "🍳",
    description: "Deep-fried crispy pork belly, golden-brown crackling skin",
  },
  {
    id: "rice",
    name: "Rice",
    pricePhp: 15,
    emoji: "🍚",
    description: "Plain white steamed rice",
  },
] as const;

export type TrayDishId = (typeof TRAY_MENU)[number]["id"];

/**
 * Convenience lookup by dish id. Throws if the id is unknown.
 */
export function getTrayDish(dishId: TrayDishId) {
  const dish = TRAY_MENU.find((d) => d.id === dishId);
  if (!dish) {
    throw new Error(`Unknown TRAY_MENU dishId: ${dishId}`);
  }
  return dish;
}
