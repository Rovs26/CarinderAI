"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CategoryChipRow } from "@/components/CategoryChipRow";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { useT } from "@/lib/language-context";
import { NearbyMerchantsSection } from "./NearbyMerchantsSection";

export interface MarketSupplier {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
}

export interface MarketProduct {
  id: string;
  supplierId: string;
  name: string;
  category: string;
  unit: "kg" | "pc" | "L" | "pack";
  pricePhp: number;
  stock: number;
  imageUrl: string;
}

export interface MarketViewProps {
  suppliers: MarketSupplier[];
  products: MarketProduct[];
}

// The "All" sentinel uses a stable internal value; the chip label is
// localized via `useT('category_all')`. The other category strings are
// domain identifiers that match `Product.category` in the database, so
// they are NOT translated — the row labels them in their canonical form.
const CATEGORY_ALL = "All";
const REAL_CATEGORIES: readonly string[] = [
  "Meat & Eggs",
  "Fish",
  "Vegetables",
  "Condiments",
  "Rice/Grains",
];

/**
 * Client island for `/market` (Req 2.1–2.7). Owns two pieces of local state:
 * the active category chip and the active supplier pill. Filters the product
 * grid by both. Renders `EmptyState` when the filter combination yields zero
 * matches (Req 2.6).
 */
export function MarketView({ suppliers, products }: MarketViewProps) {
  const t = useT();
  const [activeMarketTab, setActiveMarketTab] = useState<"suppliers" | "nearby">(
    "suppliers",
  );
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORY_ALL);
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const categoryOk =
      activeCategory === CATEGORY_ALL || p.category === activeCategory;
    const supplierOk =
      activeSupplierId === null || p.supplierId === activeSupplierId;
    return categoryOk && supplierOk;
  });

  const handleSupplierTap = (supplierId: string | null) => {
    if (supplierId === null) {
      setActiveSupplierId(null);
      return;
    }
    setActiveSupplierId((prev) => (prev === supplierId ? null : supplierId));
  };

  // The "All" chip is rendered with the localized label but still carries the
  // internal "All" sentinel as its value so filter logic stays simple.
  const chipLabels = [t("category_all"), ...REAL_CATEGORIES];
  const activeChipLabel =
    activeCategory === CATEGORY_ALL ? t("category_all") : activeCategory;
  const handleChipSelect = (label: string) => {
    setActiveCategory(label === t("category_all") ? CATEGORY_ALL : label);
  };

  return (
    <div className="flex flex-col">
      <AppHeader title={t("heading_market")} subtitle={t("subtitle_market")} />

      {/* Top tab strip — switches between formal Suppliers (default) and
          informal Nearby merchants. The Nearby tab is purely additive and
          does not interact with the cart. */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          aria-pressed={activeMarketTab === "suppliers"}
          onClick={() => setActiveMarketTab("suppliers")}
          className={`pill ${activeMarketTab === "suppliers" ? "pill-active" : ""}`}
        >
          {t("market_tab_suppliers")}
        </button>
        <button
          type="button"
          aria-pressed={activeMarketTab === "nearby"}
          onClick={() => setActiveMarketTab("nearby")}
          className={`pill ${activeMarketTab === "nearby" ? "pill-active" : ""}`}
        >
          {t("market_tab_nearby")}
        </button>
      </div>

      {activeMarketTab === "suppliers" ? (
        <>
          <div className="px-4 pt-3">
            <CategoryChipRow
              categories={chipLabels}
              active={activeChipLabel}
              onSelect={handleChipSelect}
            />
          </div>

          <div className="section-band" />

          <div className="px-4 pt-3">
            <SupplierPillRow
              suppliers={suppliers}
              activeSupplierId={activeSupplierId}
              onSelect={handleSupplierTap}
              allLabel={t("supplier_all")}
            />
          </div>

          <div className="px-4 pt-4 pb-6">
            {filtered.length === 0 ? (
              <EmptyState
                title={t("empty_market_filter_title")}
                body={t("empty_market_filter_body")}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <NearbyMerchantsSection />
      )}
    </div>
  );
}

interface SupplierPillRowProps {
  suppliers: MarketSupplier[];
  activeSupplierId: string | null;
  onSelect: (supplierId: string | null) => void;
  allLabel: string;
}

function SupplierPillRow({
  suppliers,
  activeSupplierId,
  onSelect,
  allLabel,
}: SupplierPillRowProps) {
  const base =
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  const tone = (isActive: boolean) =>
    isActive ? "pill pill-active" : "pill";

  return (
    <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-3">
      <button
        type="button"
        aria-pressed={activeSupplierId === null}
        onClick={() => onSelect(null)}
        className={`${base} ${tone(activeSupplierId === null)}`}
      >
        {allLabel}
      </button>
      {suppliers.map((supplier) => {
        const isActive = supplier.id === activeSupplierId;
        return (
          <button
            key={supplier.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(supplier.id)}
            className={`${base} ${tone(isActive)}`}
          >
            {supplier.name}
          </button>
        );
      })}
    </div>
  );
}
