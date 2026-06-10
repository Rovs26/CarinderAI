"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useT } from "@/lib/language-context";

/**
 * `/insights` — Tier 3 mocked Insights_Module (Reqs 11.1–11.4).
 *
 * Hardcoded surface: no Prisma reads, no API calls, no ML inference, no
 * external prediction service. The only dynamic value is the current
 * day-of-week, which Req 11.2 mandates be derived from the device's local
 * time zone — hence `"use client"` (so we read the user's clock, not the
 * server's) and `useState(() => new Date())` to snapshot the time once at
 * mount rather than re-deriving on every render.
 *
 * The recommendation copy on Req 11.3 is fixed text and remains hardcoded
 * verbatim ("Suggested menu today: sinigang, lugaw, mami. Expected foot
 * traffic: -20% due to rain") — it is not routed through `useT`. Surrounding
 * frame copy (heading, subtitle, beta pill, recommendation label) is
 * localized.
 */
export default function InsightsPage() {
  const t = useT();
  const [now] = useState(() => new Date());
  const dayOfWeek = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
  }).format(now);

  return (
    <>
      <AppHeader
        title={t("heading_insights")}
        subtitle={t("subtitle_insights")}
        trailing={<span className="pill">{t("pill_beta")}</span>}
      />
      <main className="flex flex-col gap-4 px-4 py-4">
        {/* Weather + day-of-week card (Reqs 11.1, 11.2) */}
        <section className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl">
              🌧️
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-ink">26°C</span>
              <span className="text-xs text-muted">Rainy</span>
            </div>
          </div>
          <span className="text-sm text-muted">{dayOfWeek}</span>
        </section>

        {/* Recommendation card (Req 11.3) */}
        <section className="card flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span aria-hidden="true">🍲</span>
            <span>{t("recommended_menu_today_label")}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="pill">sinigang</span>
            <span className="pill">lugaw</span>
            <span className="pill">mami</span>
          </div>
          <p className="text-sm text-danger">
            Expected foot traffic: -20% due to rain
          </p>
        </section>
      </main>
    </>
  );
}
