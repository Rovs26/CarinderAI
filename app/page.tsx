import { getTodayKpis } from "@/lib/finance";
import { pickGreetingKey } from "@/lib/greeting";
import { HomeHeader } from "./HomeHeader";
import { HomeView } from "./HomeView";

// Dashboard_Tab (Home) — Tier 2 RSC.
// Implements Requirements 9.1–9.6 per design.md §Routing Map and §UI Component Inventory.
//
// The RSC fetches today's KPIs and selects a greeting key; the client
// `HomeView` island routes all visible copy through `useT()` so the
// dashboard honors the active language toggle (Req 13). The `HomeHeader`
// client island mounts the shared `AppHeader` with localized title/subtitle.
export default async function Home() {
  const kpis = await getTodayKpis();
  const greetingKey = pickGreetingKey();

  return (
    <>
      <HomeHeader />
      <HomeView
        greetingKey={greetingKey}
        salesPhp={kpis.salesPhp}
        expensesPhp={kpis.expensesPhp}
        netPhp={kpis.netPhp}
      />
    </>
  );
}
