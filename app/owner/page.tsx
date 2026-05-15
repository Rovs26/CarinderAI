import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { ownerDashboard } from "@/lib/mock-data";
import { formatPeso, formatPercent } from "@/lib/utils";

export default function OwnerPage() {
  const d = ownerDashboard;

  return (
    <AppShell title="Dashboard" subtitle="Aling Rosa's Lutong Bahay">
      <article className="card border-[var(--color-accent)] bg-orange-50">
        <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">
          Today&apos;s next best action
        </p>
        <h3 className="mt-1 font-semibold">Review captured order before 10 AM</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Secure better supplier pricing by confirming your list early. You have{" "}
          {d.pendingSupplierOrder.items} items pending (
          {formatPeso(d.pendingSupplierOrder.estimatedCost)} est.).
        </p>
        <Link href="/capture-order" className="btn-primary mt-4">
          Capture order
        </Link>
      </article>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricCard compact label="Sales today" value={formatPeso(d.salesToday)} />
        <MetricCard compact label="Expenses" value={formatPeso(d.expensesToday)} />
        <MetricCard
          compact
          label="Est. profit"
          value={formatPeso(d.estimatedProfit)}
          accent
        />
        <MetricCard compact label="Margin" value={formatPercent(d.profitMargin)} />
      </div>

      <article className="card mt-4">
        <h3 className="text-sm font-semibold">Low stock</h3>
        <ul className="mt-3 space-y-2">
          {d.lowStockAlerts.map((a) => (
            <li
              key={a.item}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{a.item}</span>
              <span className="shrink-0 font-medium text-[var(--color-accent)]">
                {a.level}
              </span>
            </li>
          ))}
        </ul>
      </article>

      <article className="card mt-4">
        <h3 className="text-sm font-semibold">Tomorrow prep</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{d.suggestedPrepLevel}</p>
      </article>

      <div className="mt-4 space-y-2">
        <Link href="/finance" className="btn-secondary text-sm !py-3">
          Finance tracker
        </Link>
        <Link href="/forecast" className="btn-secondary text-sm !py-3">
          Demand forecast
        </Link>
      </div>
    </AppShell>
  );
}
