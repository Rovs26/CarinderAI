import {
  getJournalEntries,
  getLast7DaysChartData,
  getTodayKpis,
} from "@/lib/finance";
import { FinanceView } from "./FinanceView";

/**
 * `/finance` — Tier 1 Accounting surface (Reqs 4.1, 4.2, 4.8, 5.1, 5.5–5.7).
 *
 * Server Component: fetches today's KPIs, the 7-day chart series, and the
 * journal list in parallel via `lib/finance.ts`, then hands them to the
 * `FinanceView` client island, which routes every visible string through
 * `useT()` so the page honors the active language toggle.
 *
 * Date values are serialized to ISO strings before crossing into the
 * client island to keep the boundary explicit.
 */
export default async function FinancePage() {
  const [kpis, chart, entries] = await Promise.all([
    getTodayKpis(),
    getLast7DaysChartData(),
    getJournalEntries(),
  ]);

  return (
    <FinanceView
      salesPhp={kpis.salesPhp}
      expensesPhp={kpis.expensesPhp}
      netPhp={kpis.netPhp}
      topProduct={kpis.topProduct}
      chart={chart}
      entries={entries.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        type: e.type,
        category: e.category,
        amountPhp: e.amountPhp,
        note: e.note,
        sourceOrderId: e.sourceOrderId,
      }))}
    />
  );
}
