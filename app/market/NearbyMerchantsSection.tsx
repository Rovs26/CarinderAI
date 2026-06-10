"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  getMerchantsByDistance,
  getMerchantsByPrice,
  type ExternalMerchant,
} from "@/lib/external-merchants";
import { useT } from "@/lib/language-context";

type SortMode = "distance" | "price";

const MAX_VISIBLE_ITEMS = 4;

/**
 * `Nearby` tab on `/market` — informal vendor feed.
 *
 * Display-only surface. The data comes from `lib/external-merchants.ts`
 * (hardcoded fixture, no Prisma); "Reserve" and "Get directions" are toast-
 * only stubs and do not modify any persistent state. There is intentionally
 * no cart wiring here — formal Suppliers stay the only path that creates
 * an Order.
 *
 * Sort modes derive from the lib helpers so the sort logic lives next to
 * the data and stays easy to adjust later.
 */
export function NearbyMerchantsSection() {
  const t = useT();
  const [sortMode, setSortMode] = useState<SortMode>("distance");

  const merchants = useMemo<ExternalMerchant[]>(
    () => (sortMode === "distance" ? getMerchantsByDistance() : getMerchantsByPrice()),
    [sortMode],
  );

  return (
    <section aria-label="Nearby merchants" className="flex flex-col">
      <header className="flex items-start justify-between gap-3 px-4 pt-1 pb-3">
        <p className="text-xs text-muted">{t("market_nearby_subtitle")}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-pressed={sortMode === "distance"}
            onClick={() => setSortMode("distance")}
            className={`pill ${sortMode === "distance" ? "pill-active" : ""}`}
          >
            {t("market_sort_distance")}
          </button>
          <button
            type="button"
            aria-pressed={sortMode === "price"}
            onClick={() => setSortMode("price")}
            className={`pill ${sortMode === "price" ? "pill-active" : ""}`}
          >
            {t("market_sort_price")}
          </button>
        </div>
      </header>

      <ul className="flex flex-col">
        {merchants.map((m) => (
          <MerchantRow key={m.id} merchant={m} />
        ))}
      </ul>
    </section>
  );
}

interface MerchantRowProps {
  merchant: ExternalMerchant;
}

/** Single feed row for an external merchant. Pure presentation + toast handlers. */
function MerchantRow({ merchant }: MerchantRowProps) {
  const t = useT();

  const visibleItems = merchant.availableItems.slice(0, MAX_VISIBLE_ITEMS);
  const overflow = merchant.availableItems.length - visibleItems.length;
  const priceGlyph = "₱".repeat(merchant.priceLevel);

  const handleReserve = () => {
    toast.success(t("merchant_reserve_toast"));
  };

  const handleDirections = () => {
    toast.success(t("merchant_directions_toast"));
  };

  return (
    <li className="card-flat flex gap-3">
      {/* Avatar */}
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-section text-2xl"
      >
        {merchant.emoji}
      </span>

      {/* Right column: stacked content */}
      <div className="flex flex-1 min-w-0 flex-col gap-1.5">
        <p className="text-base font-semibold text-ink truncate">{merchant.name}</p>

        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
          <span>★ {merchant.rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          <span>{merchant.distanceLabel}</span>
          <span aria-hidden="true">·</span>
          <span>
            {merchant.walkingMinutes} {t("merchant_walking_time")}
          </span>
          <span aria-hidden="true">·</span>
          <span aria-label={`Price level ${merchant.priceLevel} of 3`}>
            {priceGlyph}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleItems.map((item) => (
            <span key={item} className="pill">
              {item}
            </span>
          ))}
          {overflow > 0 ? (
            <span className="pill">+{overflow} more</span>
          ) : null}
        </div>

        <p className="text-xs italic text-muted">{merchant.contactHint}</p>

        {!merchant.acceptsOrders ? (
          <span
            className="pill self-start"
            style={{
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              color: "#b45309",
            }}
          >
            {t("merchant_walk_in_only")}
          </span>
        ) : null}

        <div className="flex gap-2 pt-1">
          {merchant.acceptsOrders ? (
            <button
              type="button"
              onClick={handleReserve}
              className="btn-primary !py-1.5 !text-sm"
            >
              {t("merchant_reserve")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDirections}
            className="btn-secondary !py-1.5 !text-sm"
          >
            {t("merchant_walk_to")}
          </button>
        </div>
      </div>
    </li>
  );
}
