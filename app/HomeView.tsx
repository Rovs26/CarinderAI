"use client";

import Image from "next/image";
import Link from "next/link";
import { KpiCard } from "@/components/KpiCard";
import { useT } from "@/lib/language-context";
import type { GreetingKey } from "@/lib/greeting";

export interface HomeViewProps {
  greetingKey: GreetingKey;
  salesPhp: number;
  expensesPhp: number;
  netPhp: number;
}

/**
 * Client island for `/` (Dashboard_Tab).
 *
 * Layout:
 *   1. Hero banner image (`/assets/hero-banner.png`, 5:2 aspect) — visual
 *      anchor for the new design system; unchanged data underneath.
 *   2. A `card` block that wraps:
 *      - An uppercase eyebrow "FOR CARINDERIA OWNERS"
 *      - The Tagalog greeting (via `useT(greetingKey)`)
 *      - The KPI quartet (sales / expenses / net)
 *      - Three quick-action CTA buttons (Scan / Order / Log Sale)
 *
 * Hooks (`useT`) and props (`greetingKey`, `salesPhp`, `expensesPhp`,
 * `netPhp`) are unchanged from before.
 */
export function HomeView({
  greetingKey,
  salesPhp,
  expensesPhp,
  netPhp,
}: HomeViewProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      {/* 1. Hero banner */}
      <div className="relative aspect-[5/2] overflow-hidden rounded-xl">
        <Image
          src="/assets/hero-banner.png"
          alt="CarinderAI"
          fill
          priority
          sizes="(max-width: 480px) 100vw, 480px"
          className="object-cover"
        />
      </div>

      {/* 2. Warm card containing greeting, KPIs, and quick actions */}
      <section className="card flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            For carinderia owners
          </span>
          <h2 className="text-xl font-bold text-ink">{t(greetingKey)}</h2>
          <p className="text-sm text-muted">{t("subtitle_dashboard")}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <KpiCard label={t("kpi_sales_today")} valuePhp={salesPhp} />
          <KpiCard label={t("kpi_expenses_today")} valuePhp={expensesPhp} />
          <KpiCard label={t("kpi_net_today")} valuePhp={netPhp} />
        </div>

        <nav className="flex flex-col gap-2">
          <Link
            href="/scan"
            className="btn-primary gap-2"
          >
            <span aria-hidden>📷</span>
            {t("cta_scan")}
          </Link>
          <Link
            href="/market"
            className="btn-primary gap-2"
          >
            <span aria-hidden>🛒</span>
            {t("cta_order")}
          </Link>
          <Link
            href="/finance/new?type=REVENUE"
            className="btn-primary gap-2"
          >
            <span aria-hidden>💰</span>
            {t("cta_log_sale")}
          </Link>
        </nav>
      </section>
    </div>
  );
}
