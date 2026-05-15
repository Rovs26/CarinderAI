"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { ownerDashboard } from "@/lib/mock-data";
import { formatPeso, formatPercent } from "@/lib/utils";

export default function OwnerPage() {
  const d = ownerDashboard;
  const [orderReviewed, setOrderReviewed] = useState(false);

  return (
    <AppShell title="Dashboard" subtitle="Aling Rosa's Lutong Bahay">
      <Link href="/capture-order" className="card-warm card block active:scale-[0.99]">
        <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">
          Today&apos;s next best action
        </p>
        <h3 className="mt-1 font-semibold">Review captured order before 10 AM</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Secure better supplier pricing by confirming your list early.
        </p>
        <span className="btn-primary mt-4 inline-flex">Capture order →</span>
      </Link>

      <button
        type="button"
        onClick={() => setOrderReviewed(true)}
        className={`card mt-4 w-full text-left active:scale-[0.99] ${
          orderReviewed ? "ring-2 ring-emerald-400/50" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Pending supplier order</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              orderReviewed
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {orderReviewed ? "Ready for review" : "Review needed"}
          </span>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {d.pendingSupplierOrder.items} items · {formatPeso(d.pendingSupplierOrder.estimatedCost)}{" "}
          est. · {d.pendingSupplierOrder.supplier}
        </p>
        {!orderReviewed && (
          <p className="mt-2 text-xs text-[var(--color-accent)]">Tap to mark as reviewed</p>
        )}
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricCard compact label="Sales today" value={formatPeso(d.salesToday)} />
        <MetricCard compact label="Expenses" value={formatPeso(d.expensesToday)} />
        <MetricCard compact label="Est. profit" value={formatPeso(d.estimatedProfit)} accent />
        <MetricCard compact label="Margin" value={formatPercent(d.profitMargin)} />
      </div>

      <article className="card mt-4">
        <h3 className="text-sm font-semibold">Low stock</h3>
        <ul className="mt-3 space-y-2">
          {d.lowStockAlerts.map((a) => (
            <li key={a.item} className="flex justify-between gap-2 text-sm">
              <span>{a.item}</span>
              <span className="shrink-0 font-medium text-[var(--color-accent)]">{a.level}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="card mt-4">
        <h3 className="text-sm font-semibold">Tomorrow prep</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{d.suggestedPrepLevel}</p>
      </article>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/finance" className="btn-secondary text-sm !py-3">
          Finance
        </Link>
        <Link href="/forecast" className="btn-secondary text-sm !py-3">
          Forecast
        </Link>
      </div>
    </AppShell>
  );
}
