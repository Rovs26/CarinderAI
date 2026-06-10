"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { formatPhp } from "@/lib/currency";
import type { FeaturedDish, SearchResult } from "@/lib/discovery";
import { useT } from "@/lib/language-context";

/**
 * Serialized carinderia row passed in from the parent RSC.
 * Mirrors the shape of `prisma.carinderia.findMany()` rows minus the
 * Date fields (none on this model) and any nested relations.
 */
export interface DiscoveryCarinderia {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number;
  priceRange: string;
  topDish: string;
  imageUrl: string;
}

export interface DiscoveryViewProps {
  carinderias: DiscoveryCarinderia[];
  featuredDishes: FeaturedDish[];
}

const DEBOUNCE_MS = 300;

/**
 * `/customers` discovery surface.
 *
 * Shows three modes:
 *   1. Empty query (default): "Featured today" horizontal scroll, then
 *      "All carinderias" feed — same layout as the original /customers.
 *   2. Active query, in-flight: spinner while fetching.
 *   3. Active query, results back: search results feed (or empty state).
 *
 * The search bar lives in a sticky `.top-bar` row directly below the page
 * AppHeader. Input changes are debounced 300ms before hitting
 * `/api/discovery/search`. The current request is tracked via a ref so a
 * stale response doesn't overwrite a fresher one — useful when typing
 * fast.
 */
export function DiscoveryView({
  carinderias,
  featuredDishes,
}: DiscoveryViewProps) {
  const t = useT();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Bumped on each new fetch; the response handler ignores stale results.
  const requestSeqRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (value.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const seq = ++requestSeqRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/discovery/search?q=${encodeURIComponent(value)}`,
        );
        const body = (await res.json()) as { results?: SearchResult[] };
        if (seq !== requestSeqRef.current) return; // stale
        setSearchResults(body.results ?? []);
      } catch (err) {
        console.error("[/customers] search failed", err);
        if (seq === requestSeqRef.current) {
          setSearchResults([]);
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);
  };

  // Cancel pending debounce on unmount so we don't fetch after navigating away.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const trimmed = searchQuery.trim();
  const showSearchMode = trimmed !== "";

  return (
    <>
      {/* Sticky search row — visually extends the AppHeader. */}
      <div className="top-bar sticky top-[57px] z-30 px-4 py-2">
        <input
          type="search"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={t("discovery_search_placeholder")}
          aria-label={t("discovery_search_placeholder")}
          className="input-touch placeholder:text-muted/60"
        />
      </div>

      {showSearchMode ? (
        <SearchSection
          results={searchResults}
          isSearching={isSearching}
        />
      ) : (
        <DefaultSection
          carinderias={carinderias}
          featuredDishes={featuredDishes}
        />
      )}
    </>
  );
}

interface SearchSectionProps {
  results: SearchResult[];
  isSearching: boolean;
}

function SearchSection({ results, isSearching }: SearchSectionProps) {
  const t = useT();

  return (
    <section aria-label="Search results" className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-ink">
          {t("discovery_search_results")}
        </h2>
        {!isSearching && results.length > 0 ? (
          <span className="text-xs text-muted">
            {results.length} {t("discovery_results_count")}
          </span>
        ) : null}
      </div>

      {isSearching ? <Spinner /> : null}

      {!isSearching && results.length === 0 ? (
        <EmptyState
          title={t("discovery_search_empty")}
          body={t("discovery_search_empty_body")}
        />
      ) : null}

      {!isSearching && results.length > 0 ? (
        <ul className="flex flex-col">
          {results.map((r, idx) => (
            <SearchResultRow
              key={`${r.type}-${r.menuItemId ?? r.carinderiaId}-${idx}`}
              result={r}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function SearchResultRow({ result }: { result: SearchResult }) {
  const t = useT();
  const isDish = result.type === "dish";
  const avatarEmoji = isDish ? "🍲" : "🏠";
  const matchLabel = isDish
    ? t("discovery_search_dish_match")
    : t("discovery_search_carinderia_match");

  return (
    <li>
      <Link
        href={`/customers/${result.carinderiaId}`}
        className="card-flat flex items-center gap-3"
      >
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-section text-2xl"
        >
          {avatarEmoji}
        </span>
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink truncate">
              {isDish ? result.dishName : result.carinderiaName}
            </p>
            <span className="pill shrink-0 !py-0 !text-[10px]">
              {matchLabel}
            </span>
          </div>
          {isDish ? (
            <p className="text-xs text-muted truncate">
              {t("discovery_view_at")} {result.carinderiaName} · ★{" "}
              {result.carinderiaRating.toFixed(1)} ·{" "}
              {result.carinderiaDistanceKm} km
            </p>
          ) : (
            <p className="text-xs text-muted truncate">
              ★ {result.carinderiaRating.toFixed(1)} ·{" "}
              {result.carinderiaDistanceKm} km
            </p>
          )}
        </div>
        {isDish && typeof result.dishPricePhp === "number" ? (
          <span className="text-sm font-semibold text-primary shrink-0">
            {formatPhp(result.dishPricePhp)}
          </span>
        ) : (
          <span aria-hidden="true" className="text-muted">›</span>
        )}
      </Link>
    </li>
  );
}

interface DefaultSectionProps {
  carinderias: DiscoveryCarinderia[];
  featuredDishes: FeaturedDish[];
}

function DefaultSection({
  carinderias,
  featuredDishes,
}: DefaultSectionProps) {
  const t = useT();

  return (
    <>
      {featuredDishes.length > 0 ? (
        <section aria-label="Featured today" className="flex flex-col gap-2 pt-4">
          <header className="px-4">
            <h2 className="text-sm font-semibold text-ink">
              {t("discovery_featured")}
            </h2>
            <p className="text-xs text-muted">
              {t("discovery_featured_subtitle")}
            </p>
          </header>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3">
            {featuredDishes.map((d) => (
              <Link
                key={d.menuItemId}
                href={`/customers/${d.carinderiaId}`}
                className="card flex w-44 flex-shrink-0 flex-col gap-2 !p-3"
              >
                <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-section text-5xl">
                  {d.carinderiaImageUrl}
                </div>
                <p className="text-sm font-semibold text-ink truncate">
                  {d.dishName}
                </p>
                <p className="text-sm font-semibold text-primary">
                  {formatPhp(d.pricePhp)}
                </p>
                <p className="text-xs text-muted truncate">
                  {d.carinderiaName} · ★ {d.carinderiaRating.toFixed(1)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="All carinderias" className="flex flex-col">
        <h2 className="px-4 pt-2 pb-2 text-sm font-semibold text-ink">
          {t("discovery_all_carinderias")}
        </h2>
        <div className="flex flex-col">
          {carinderias.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="card-flat flex items-center gap-3"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-section text-2xl"
              >
                {c.imageUrl}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {c.name}
                </p>
                <p className="text-xs text-muted truncate">{c.topDish}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <span>★ {c.rating}</span>
                  <span>·</span>
                  <span>{c.distanceKm} km</span>
                  <span>·</span>
                  <span>{c.priceRange}</span>
                </div>
              </div>
              <span aria-hidden="true" className="text-muted">›</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
