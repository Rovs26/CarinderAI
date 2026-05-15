export type Carinderia = {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  rating: number;
};

export type Dish = {
  id: string;
  carinderiaId: string;
  name: string;
  price: number;
  availability: "available" | "limited" | "sold_out";
  isBestSeller?: boolean;
  description: string;
};

export type Supplier = {
  id: string;
  name: string;
  categories: string[];
  minimumOrder: number;
  deliveryArea: string;
  exampleProducts: string[];
  rating: number;
};

export type OrderLineItem = {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  notes: string;
};

export const carinderias: Carinderia[] = [
  {
    id: "c1",
    name: "Aling Rosa's Lutong Bahay",
    location: "Poblacion, Quezon City",
    distanceKm: 0.3,
    rating: 4.8,
  },
  {
    id: "c2",
    name: "Kuya Ben's Carinderia",
    location: "Barangay Holy Spirit",
    distanceKm: 0.7,
    rating: 4.6,
  },
  {
    id: "c3",
    name: "Nanay Lita's Kitchen",
    location: "Teachers Village",
    distanceKm: 1.2,
    rating: 4.9,
  },
  {
    id: "c4",
    name: "Tita Cora's Daily Meals",
    location: "UP Village",
    distanceKm: 1.5,
    rating: 4.5,
  },
];

export const dishes: Dish[] = [
  {
    id: "d1",
    carinderiaId: "c1",
    name: "Chicken Adobo",
    price: 65,
    availability: "available",
    isBestSeller: true,
    description: "Classic soy-vinegar adobo with rice",
  },
  {
    id: "d2",
    carinderiaId: "c1",
    name: "Sinigang na Baboy",
    price: 75,
    availability: "available",
    description: "Sour tamarind soup with pork",
  },
  {
    id: "d3",
    carinderiaId: "c2",
    name: "Fried Chicken",
    price: 80,
    availability: "limited",
    isBestSeller: true,
    description: "Crispy fried chicken with gravy",
  },
  {
    id: "d4",
    carinderiaId: "c2",
    name: "Pancit Canton",
    price: 55,
    availability: "available",
    description: "Stir-fried noodles with vegetables",
  },
  {
    id: "d5",
    carinderiaId: "c3",
    name: "Kare-Kare",
    price: 90,
    availability: "available",
    isBestSeller: true,
    description: "Oxtail stew with peanut sauce",
  },
  {
    id: "d6",
    carinderiaId: "c3",
    name: "Tinola",
    price: 70,
    availability: "sold_out",
    description: "Ginger chicken soup with papaya",
  },
  {
    id: "d7",
    carinderiaId: "c4",
    name: "Menudo",
    price: 60,
    availability: "available",
    description: "Pork stew with potatoes and carrots",
  },
  {
    id: "d8",
    carinderiaId: "c4",
    name: "Laing",
    price: 50,
    availability: "limited",
    description: "Taro leaves in coconut milk",
  },
];

export const suppliers: Supplier[] = [
  {
    id: "s1",
    name: "Palengke Express",
    categories: ["Meat", "Produce", "Dry goods"],
    minimumOrder: 1500,
    deliveryArea: "Quezon City, Marikina",
    exampleProducts: ["Chicken", "Pork", "Vegetables", "Rice"],
    rating: 4.7,
  },
  {
    id: "s2",
    name: "Manok at Itlog Wholesale",
    categories: ["Poultry", "Eggs"],
    minimumOrder: 800,
    deliveryArea: "Metro Manila North",
    exampleProducts: ["Whole chicken", "Eggs by tray", "Chicken parts"],
    rating: 4.5,
  },
  {
    id: "s3",
    name: "Bigasan Direct",
    categories: ["Rice", "Grains"],
    minimumOrder: 2000,
    deliveryArea: "NCR wide",
    exampleProducts: ["Jasmine rice 25kg", "Brown rice", "Glutinous rice"],
    rating: 4.8,
  },
  {
    id: "s4",
    name: "Sari-Sari Supply Co.",
    categories: ["Cooking oil", "Condiments", "Spices"],
    minimumOrder: 500,
    deliveryArea: "Quezon City",
    exampleProducts: ["Cooking oil", "Garlic", "Onion", "Soy sauce"],
    rating: 4.4,
  },
];

export const ownerDashboard = {
  salesToday: 4850,
  expensesToday: 2100,
  estimatedProfit: 2750,
  profitMargin: 56.7,
  pendingSupplierOrder: {
    items: 6,
    estimatedCost: 4250,
    supplier: "Palengke Express",
  },
  lowStockAlerts: [
    { item: "Cooking oil", level: "2 liters left" },
    { item: "Garlic", level: "500g left" },
    { item: "Eggs", level: "1 tray left" },
  ],
  suggestedPrepLevel: "High — expect lunch rush near office area on weekday",
};

export const sampleExtractedText =
  "Chicken 5 kg, rice 25 kg, eggs 3 trays, cooking oil 2 liters, garlic 1 kg, onion 2 kg";

export const sampleExtractedOrder: OrderLineItem[] = [
  {
    id: "1",
    item: "Chicken",
    quantity: 5,
    unit: "kg",
    notes: "for adobo and fried chicken",
  },
  {
    id: "2",
    item: "Rice",
    quantity: 25,
    unit: "kg",
    notes: "daily supply",
  },
  {
    id: "3",
    item: "Eggs",
    quantity: 3,
    unit: "trays",
    notes: "breakfast menu",
  },
  {
    id: "4",
    item: "Cooking oil",
    quantity: 2,
    unit: "liters",
    notes: "frying",
  },
  {
    id: "5",
    item: "Garlic",
    quantity: 1,
    unit: "kg",
    notes: "aromatics",
  },
  {
    id: "6",
    item: "Onion",
    quantity: 2,
    unit: "kg",
    notes: "aromatics",
  },
];

export const orderDraftSummary = {
  estimatedTotalCost: 4250,
  suggestedSupplier: "Palengke Express",
};

export const financialSample = {
  revenueToday: 4850,
  ingredientExpenses: 1650,
  otherExpenses: 450,
};

export const impactMetrics = [
  { label: "Order entry time saved", value: "15 min", sub: "per supplier order" },
  { label: "Owners using paper lists", value: "78%", sub: "of surveyed carinderias" },
  { label: "Fewer stockouts", value: "32%", sub: "with demand projection" },
  { label: "Daily profit visibility", value: "100%", sub: "same-day tracking" },
];

export type LocationType =
  | "school"
  | "office"
  | "residential"
  | "market";
export type DayType = "weekday" | "weekend" | "holiday";
export type WeatherType = "sunny" | "rainy" | "stormy";

export function computeForecast(
  location: LocationType,
  dayType: DayType,
  weather: WeatherType,
  expectedCustomers: number
): {
  demand: "low" | "normal" | "high";
  prepLevel: string;
  ingredientBudget: number;
  notes: string[];
} {
  let score = expectedCustomers;

  if (location === "school") score += dayType === "weekday" ? 15 : -5;
  if (location === "office") score += dayType === "weekday" ? 20 : -10;
  if (location === "residential") score += dayType === "weekend" ? 10 : 0;
  if (location === "market") score += 5;

  if (dayType === "holiday") score += 25;
  if (dayType === "weekend") score += 10;

  if (weather === "rainy") score -= 15;
  if (weather === "stormy") score -= 30;

  let demand: "low" | "normal" | "high";
  if (score < 40) demand = "low";
  else if (score < 80) demand = "normal";
  else demand = "high";

  const prepLevels = {
    low: "Light prep — cook 60% of usual portions",
    normal: "Standard prep — follow regular menu quantities",
    high: "Heavy prep — increase rice, ulam, and bestsellers by 30%",
  };

  const budgets = { low: 1800, normal: 2800, high: 4200 };

  const notes: string[] = [];
  if (location === "school" && dayType === "weekday")
    notes.push("School area boosts lunch demand on weekdays.");
  if (location === "office" && dayType === "weekday")
    notes.push("Office workers drive peak 11am–1pm orders.");
  if (weather === "rainy")
    notes.push("Rainy weather may reduce walk-in customers.");
  if (weather === "stormy")
    notes.push("Stormy conditions — consider smaller batches and safety stock.");
  if (dayType === "holiday")
    notes.push("Holiday traffic often increases family takeout orders.");
  if (notes.length === 0)
    notes.push("Conditions are balanced — monitor sales by noon and adjust.");

  return {
    demand,
    prepLevel: prepLevels[demand],
    ingredientBudget: budgets[demand],
    notes,
  };
}

export function getCarinderiaName(id: string): string {
  return carinderias.find((c) => c.id === id)?.name ?? "Unknown";
}
