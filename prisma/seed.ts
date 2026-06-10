/**
 * CarinderAI database seed.
 *
 * Implements Requirement 15 (Seed Data) and design.md §Seed Plan:
 *   - 6 Suppliers (Req 15.2)
 *   - 28 Products spanning {Meat & Eggs, Fish, Vegetables, Condiments, Rice/Grains}
 *     with unit ∈ {kg, pc, L, pack} and emoji-glyph imageUrl (Req 15.3, 15.4, 14.2)
 *   - 4 Carinderias with Makati barangay addresses (Req 15.5)
 *   - ≥3 MenuItems per Carinderia (Req 15.6)
 *   - JournalEntries spanning the last 7 calendar days mixing REVENUE (Sales) and
 *     EXPENSE (Supplies, Palengke, Utilities, LPG) so Finance is non-empty on first
 *     launch (Req 15.7, 15.8)
 *   - For "today", one Order (status='PLACED') with OrderItems and a paired
 *     JournalEntry (type='EXPENSE', category='Supplies', sourceOrderId=order.id)
 *     to anchor the auto-journaling invariant (Req 3.7)
 *
 * The script is safe to re-run: it deletes every row in the seven seeded tables in
 * dependency-safe order before inserting.
 */

import { PrismaClient, Unit, JournalEntryType } from "@prisma/client";
import { startOfDay, subDays, addHours, addMinutes } from "date-fns";

const prisma = new PrismaClient();

// ─── Suppliers (6) ────────────────────────────────────────────────────────────

type SupplierKey =
  | "Magnolia Meats"
  | "Dizon Farms"
  | "Bounty Fresh"
  | "NutriAsia"
  | "Pure Foods"
  | "Farm Fresh";

const suppliersSeed: ReadonlyArray<{
  name: SupplierKey;
  category: string;
  logoUrl: string;
}> = [
  { name: "Magnolia Meats", category: "Meat", logoUrl: "/suppliers/magnolia.svg" },
  { name: "Dizon Farms", category: "Vegetables", logoUrl: "/suppliers/dizon.svg" },
  { name: "Bounty Fresh", category: "Poultry & Fish", logoUrl: "/suppliers/bounty.svg" },
  { name: "NutriAsia", category: "Condiments", logoUrl: "/suppliers/nutriasia.svg" },
  { name: "Pure Foods", category: "Meat (processed)", logoUrl: "/suppliers/purefoods.svg" },
  { name: "Farm Fresh", category: "Produce & Grains", logoUrl: "/suppliers/farmfresh.svg" },
];

// ─── Products (28) ────────────────────────────────────────────────────────────

type ProductCategory =
  | "Meat & Eggs"
  | "Fish"
  | "Vegetables"
  | "Condiments"
  | "Rice/Grains";

interface ProductSeed {
  name: string;
  category: ProductCategory;
  unit: Unit;
  pricePhp: number;
  stock: number;
  imageUrl: string; // single emoji glyph per Req 14.2
  supplier: SupplierKey;
}

const productsSeed: ReadonlyArray<ProductSeed> = [
  { name: "Pork belly", category: "Meat & Eggs", unit: Unit.kg, pricePhp: 360, stock: 25, imageUrl: "🥓", supplier: "Magnolia Meats" },
  { name: "Pork shoulder", category: "Meat & Eggs", unit: Unit.kg, pricePhp: 320, stock: 20, imageUrl: "🍖", supplier: "Magnolia Meats" },
  { name: "Chicken whole", category: "Meat & Eggs", unit: Unit.pc, pricePhp: 250, stock: 30, imageUrl: "🐔", supplier: "Bounty Fresh" },
  { name: "Chicken breast", category: "Meat & Eggs", unit: Unit.kg, pricePhp: 280, stock: 24, imageUrl: "🍗", supplier: "Bounty Fresh" },
  { name: "Ground beef", category: "Meat & Eggs", unit: Unit.kg, pricePhp: 420, stock: 12, imageUrl: "🥩", supplier: "Pure Foods" },
  { name: "Bangus", category: "Fish", unit: Unit.pc, pricePhp: 180, stock: 40, imageUrl: "🐟", supplier: "Bounty Fresh" },
  { name: "Tilapia", category: "Fish", unit: Unit.kg, pricePhp: 200, stock: 30, imageUrl: "🐠", supplier: "Bounty Fresh" },
  { name: "Itlog", category: "Meat & Eggs", unit: Unit.pack, pricePhp: 240, stock: 50, imageUrl: "🥚", supplier: "Pure Foods" },
  { name: "Kangkong", category: "Vegetables", unit: Unit.pack, pricePhp: 30, stock: 60, imageUrl: "🥬", supplier: "Dizon Farms" },
  { name: "Pechay", category: "Vegetables", unit: Unit.pack, pricePhp: 35, stock: 60, imageUrl: "🥬", supplier: "Dizon Farms" },
  { name: "Sitaw", category: "Vegetables", unit: Unit.pack, pricePhp: 40, stock: 50, imageUrl: "🌱", supplier: "Dizon Farms" },
  { name: "Kalabasa", category: "Vegetables", unit: Unit.kg, pricePhp: 60, stock: 30, imageUrl: "🎃", supplier: "Farm Fresh" },
  { name: "Talong", category: "Vegetables", unit: Unit.kg, pricePhp: 70, stock: 30, imageUrl: "🍆", supplier: "Farm Fresh" },
  { name: "Sibuyas", category: "Vegetables", unit: Unit.kg, pricePhp: 120, stock: 40, imageUrl: "🧅", supplier: "Dizon Farms" },
  { name: "Bawang", category: "Vegetables", unit: Unit.kg, pricePhp: 180, stock: 25, imageUrl: "🧄", supplier: "Dizon Farms" },
  { name: "Kamatis", category: "Vegetables", unit: Unit.kg, pricePhp: 80, stock: 35, imageUrl: "🍅", supplier: "Farm Fresh" },
  { name: "Kanin/Bigas", category: "Rice/Grains", unit: Unit.kg, pricePhp: 55, stock: 200, imageUrl: "🍚", supplier: "Farm Fresh" },
  { name: "Mantika", category: "Condiments", unit: Unit.L, pricePhp: 95, stock: 40, imageUrl: "🛢️", supplier: "NutriAsia" },
  { name: "Toyo", category: "Condiments", unit: Unit.L, pricePhp: 65, stock: 40, imageUrl: "🍶", supplier: "NutriAsia" },
  { name: "Suka", category: "Condiments", unit: Unit.L, pricePhp: 55, stock: 40, imageUrl: "🧪", supplier: "NutriAsia" },
  { name: "Patis", category: "Condiments", unit: Unit.L, pricePhp: 70, stock: 30, imageUrl: "🐟", supplier: "NutriAsia" },
  { name: "Asin", category: "Condiments", unit: Unit.pack, pricePhp: 25, stock: 80, imageUrl: "🧂", supplier: "NutriAsia" },
  { name: "Paminta", category: "Condiments", unit: Unit.pack, pricePhp: 40, stock: 60, imageUrl: "🌶️", supplier: "NutriAsia" },
  { name: "Gatas", category: "Condiments", unit: Unit.L, pricePhp: 110, stock: 20, imageUrl: "🥛", supplier: "Pure Foods" },
  { name: "Atsuete", category: "Condiments", unit: Unit.pack, pricePhp: 35, stock: 40, imageUrl: "🌶️", supplier: "NutriAsia" },
  { name: "Laurel", category: "Condiments", unit: Unit.pack, pricePhp: 30, stock: 40, imageUrl: "🍃", supplier: "NutriAsia" },
  { name: "Mais (corn)", category: "Rice/Grains", unit: Unit.kg, pricePhp: 70, stock: 30, imageUrl: "🌽", supplier: "Farm Fresh" },
  { name: "Munggo", category: "Rice/Grains", unit: Unit.kg, pricePhp: 95, stock: 25, imageUrl: "🫘", supplier: "Farm Fresh" },
];

// ─── Carinderias (4) + MenuItems (≥3 each) ───────────────────────────────────

type CarinderiaKey =
  | "Aling Nena's Carinderia"
  | "Tita Beth's Lutong Bahay"
  | "Mang Pedro's Turo-Turo"
  | "Lola Cora's Kitchen";

interface CarinderiaSeed {
  name: CarinderiaKey;
  address: string;
  distanceKm: number;
  rating: number;
  priceRange: string;
  topDish: string;
  imageUrl: string;
  menu: ReadonlyArray<{ name: string; pricePhp: number }>;
}

const carinderiasSeed: ReadonlyArray<CarinderiaSeed> = [
  {
    name: "Aling Nena's Carinderia",
    address: "Brgy. Poblacion, Makati",
    distanceKm: 0.4,
    rating: 4.6,
    priceRange: "₱",
    topDish: "Pork sinigang",
    imageUrl: "🍲",
    menu: [
      { name: "Sinigang", pricePhp: 85 },
      { name: "Adobo", pricePhp: 75 },
      { name: "Tortang Talong", pricePhp: 45 },
      { name: "Kanin", pricePhp: 15 },
    ],
  },
  {
    name: "Tita Beth's Lutong Bahay",
    address: "Brgy. Bel-Air, Makati",
    distanceKm: 1.1,
    rating: 4.4,
    priceRange: "₱",
    topDish: "Adobo",
    imageUrl: "🍲",
    menu: [
      { name: "Adobo", pricePhp: 70 },
      { name: "Tinola", pricePhp: 70 },
      { name: "Pinakbet", pricePhp: 60 },
      { name: "Kanin", pricePhp: 15 },
    ],
  },
  {
    name: "Mang Pedro's Turo-Turo",
    address: "Brgy. Guadalupe Nuevo, Makati",
    distanceKm: 1.8,
    rating: 4.2,
    priceRange: "₱",
    topDish: "Bistek",
    imageUrl: "🍲",
    menu: [
      { name: "Bistek", pricePhp: 90 },
      { name: "Bicol Express", pricePhp: 85 },
      { name: "Ginisang Munggo", pricePhp: 55 },
      { name: "Kanin", pricePhp: 15 },
    ],
  },
  {
    name: "Lola Cora's Kitchen",
    address: "Brgy. San Antonio, Makati",
    distanceKm: 2.4,
    rating: 4.8,
    priceRange: "₱₱",
    topDish: "Kare-kare",
    imageUrl: "🍲",
    menu: [
      { name: "Kare-kare", pricePhp: 110 },
      { name: "Crispy Pata", pricePhp: 180 },
      { name: "Lechon Kawali", pricePhp: 130 },
      { name: "Kanin", pricePhp: 15 },
    ],
  },
];


// ─── Deterministic pseudo-random helpers ─────────────────────────────────────
// We use a small seeded PRNG so every `prisma db seed` run produces the same
// JournalEntry mix. This makes the dataset predictable for design verification
// (Req 15.8) without depending on real wall-clock randomness.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xc111dc11); // "carinderia"

function randInt(min: number, max: number): number {
  // inclusive on both ends
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randPhp(min: number, max: number): number {
  // amounts to the nearest peso, capped to two decimals via Number toFixed
  const v = rand() * (max - min) + min;
  return Number(v.toFixed(2));
}

function pick<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1) Wipe in dependency-safe order so re-runs don't duplicate rows.
  //    OrderItem and JournalEntry FK Order, MenuItem FKs Carinderia, Product FKs Supplier.
  await prisma.menuItem.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.carinderia.deleteMany();

  // 2) Suppliers (6).
  const supplierIdByName = new Map<SupplierKey, string>();
  for (const s of suppliersSeed) {
    const created = await prisma.supplier.create({
      data: { name: s.name, category: s.category, logoUrl: s.logoUrl },
    });
    supplierIdByName.set(s.name, created.id);
  }

  // 3) Products (28).
  const productIdByName = new Map<string, string>();
  const productPriceByName = new Map<string, number>();
  for (const p of productsSeed) {
    const supplierId = supplierIdByName.get(p.supplier);
    if (!supplierId) {
      throw new Error(`Seed error: supplier "${p.supplier}" missing for product "${p.name}"`);
    }
    const created = await prisma.product.create({
      data: {
        supplierId,
        name: p.name,
        category: p.category,
        unit: p.unit,
        pricePhp: p.pricePhp,
        stock: p.stock,
        imageUrl: p.imageUrl,
      },
    });
    productIdByName.set(p.name, created.id);
    productPriceByName.set(p.name, p.pricePhp);
  }

  // 4) Carinderias (4) + MenuItems (≥3 each).
  for (const c of carinderiasSeed) {
    await prisma.carinderia.create({
      data: {
        name: c.name,
        address: c.address,
        distanceKm: c.distanceKm,
        rating: c.rating,
        priceRange: c.priceRange,
        topDish: c.topDish,
        imageUrl: c.imageUrl,
        menuItems: {
          create: c.menu.map((m) => ({ name: m.name, pricePhp: m.pricePhp })),
        },
      },
    });
  }

  // 5) JournalEntries spanning the last 7 calendar days.
  //    For each day: 1–3 REVENUE (Sales) ₱600–₱4,500, 1–2 EXPENSE
  //    drawn from {Supplies, Palengke, Utilities, LPG} ₱150–₱1,200.
  //    "today" additionally gets one Order + paired EXPENSE JournalEntry
  //    with sourceOrderId set, anchoring the auto-journaling invariant.
  const expenseCategories = ["Supplies", "Palengke", "Utilities", "LPG"] as const;
  const salesNotes = ["Lunch sales", "Dinner sales", "Merienda sales", "Almusal sales"] as const;
  const expenseNotes: Record<(typeof expenseCategories)[number], string> = {
    Supplies: "Palengke + groceries",
    Palengke: "Daily palengke run",
    Utilities: "Electricity + water",
    LPG: "Refill ng tangke",
  };

  const today = new Date();

  for (let offset = 6; offset >= 0; offset--) {
    const dayStart = startOfDay(subDays(today, offset));

    // Revenue rows for this day.
    const revenueCount = randInt(1, 3);
    for (let i = 0; i < revenueCount; i++) {
      const date = addMinutes(addHours(dayStart, randInt(8, 20)), randInt(0, 59));
      await prisma.journalEntry.create({
        data: {
          date,
          type: JournalEntryType.REVENUE,
          category: "Sales",
          amountPhp: randPhp(600, 4500),
          note: pick(salesNotes),
        },
      });
    }

    // Expense rows for this day (excluding the auto-journal row, which "today"
    // gets in addition).
    const expenseCount = randInt(1, 2);
    for (let i = 0; i < expenseCount; i++) {
      const cat = pick(expenseCategories);
      const date = addMinutes(addHours(dayStart, randInt(6, 18)), randInt(0, 59));
      await prisma.journalEntry.create({
        data: {
          date,
          type: JournalEntryType.EXPENSE,
          category: cat,
          amountPhp: randPhp(150, 1200),
          note: expenseNotes[cat],
        },
      });
    }
  }

  // 6) Anchor today's auto-journal: one Order + 2–3 OrderItems against seeded
  //    products, then a paired JournalEntry mirroring the POST /api/orders
  //    transactional invariant (Req 3.7).
  const todayStart = startOfDay(today);
  const orderCreatedAt = addMinutes(addHours(todayStart, randInt(7, 11)), randInt(0, 59));

  const candidatePicks = [
    "Pork belly",
    "Chicken whole",
    "Bangus",
    "Kangkong",
    "Mantika",
    "Toyo",
    "Kanin/Bigas",
  ];
  const itemCount = randInt(2, 3);
  const chosenNames = new Set<string>();
  while (chosenNames.size < itemCount) {
    chosenNames.add(pick(candidatePicks));
  }

  const orderLines = Array.from(chosenNames).map((productName) => {
    const productId = productIdByName.get(productName);
    const price = productPriceByName.get(productName);
    if (!productId || price === undefined) {
      throw new Error(`Seed error: product "${productName}" missing for today's Order`);
    }
    // Quantity is a positive float ≥ 0.01 (Req schema). Use 1–3 whole units to
    // keep totals readable.
    const quantity = randInt(1, 3);
    return { productId, productName, pricePhp: price, quantity };
  });

  const totalPhp = Number(
    orderLines.reduce((sum, l) => sum + l.pricePhp * l.quantity, 0).toFixed(2),
  );

  const order = await prisma.order.create({
    data: {
      status: "PLACED",
      createdAt: orderCreatedAt,
      totalPhp,
      items: {
        create: orderLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPriceSnapshot: l.pricePhp,
        })),
      },
    },
  });

  await prisma.journalEntry.create({
    data: {
      date: order.createdAt,
      type: JournalEntryType.EXPENSE,
      category: "Supplies",
      amountPhp: order.totalPhp,
      note: `Order ${order.id}`,
      sourceOrderId: order.id,
    },
  });

  // Friendly summary for `prisma db seed` log output.
  console.log(
    `Seeded: ${suppliersSeed.length} Suppliers, ${productsSeed.length} Products, ` +
      `${carinderiasSeed.length} Carinderias, ` +
      `${carinderiasSeed.reduce((s, c) => s + c.menu.length, 0)} MenuItems, ` +
      `1 Order (today) with ${orderLines.length} OrderItems, ` +
      `JournalEntries across the last 7 days (incl. paired auto-journal for today's Order).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
