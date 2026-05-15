"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { financialSample } from "@/lib/mock-data";
import { formatPeso, formatPercent } from "@/lib/utils";

export default function FinancePage() {
  const [revenue, setRevenue] = useState(financialSample.revenueToday);
  const [ingredients, setIngredients] = useState(financialSample.ingredientExpenses);
  const [other, setOther] = useState(financialSample.otherExpenses);

  const totalExpenses = ingredients + other;
  const profit = revenue - totalExpenses;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const summary = useMemo(
    () => ({ totalExpenses, profit, margin }),
    [totalExpenses, profit, margin]
  );

  return (
    <AppShell title="Finance" subtitle="Today's numbers">
      <section className="card">
        <h3 className="text-sm font-semibold">Today&apos;s inputs</h3>
        <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-muted)]">
              Revenue (₱)
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="input-touch mt-1.5"
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value) || 0)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-muted)]">
              Ingredient expenses (₱)
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="input-touch mt-1.5"
              value={ingredients}
              onChange={(e) => setIngredients(Number(e.target.value) || 0)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-muted)]">
              Other expenses (₱)
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              className="input-touch mt-1.5"
              value={other}
              onChange={(e) => setOther(Number(e.target.value) || 0)}
            />
          </label>
        </form>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <MetricCard label="Total expenses" value={formatPeso(summary.totalExpenses)} />
        <MetricCard
          label="Estimated profit"
          value={formatPeso(summary.profit)}
          accent
        />
        <MetricCard label="Profit margin" value={formatPercent(summary.margin)} />
      </div>

      <article className="card mt-4">
        <h3 className="text-sm font-semibold">Daily summary</h3>
        <dl className="mt-3 space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-[var(--color-muted)]">Revenue</dt>
            <dd className="font-medium">{formatPeso(revenue)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-[var(--color-muted)]">Ingredients</dt>
            <dd className="font-medium">{formatPeso(ingredients)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-[var(--color-muted)]">Other</dt>
            <dd className="font-medium">{formatPeso(other)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-3 text-base">
            <dt className="font-semibold">Net profit</dt>
            <dd className="font-semibold text-[var(--color-accent)]">
              {formatPeso(summary.profit)}
            </dd>
          </div>
        </dl>
      </article>
    </AppShell>
  );
}
