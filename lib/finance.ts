import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import type { JournalEntry } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Finance computations consumed by RSC pages.
// Implements Requirements 4.1, 5.1–5.6 per design.md §Finance Computations.

export type DayLabel = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface TodayKpis {
  salesPhp: number;
  expensesPhp: number;
  netPhp: number;
  topProduct: string | null;
}

export interface ChartDay {
  dayLabel: DayLabel;
  revenue: number;
  expense: number;
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return prisma.journalEntry.findMany({ orderBy: { date: 'desc' } });
}

export async function getTodayKpis(): Promise<TodayKpis> {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const entries = await prisma.journalEntry.findMany({
    where: { date: { gte: start, lte: end } },
  });

  const salesPhp = entries
    .filter((e) => e.type === 'REVENUE')
    .reduce((s, e) => s + e.amountPhp, 0);
  const expensesPhp = entries
    .filter((e) => e.type === 'EXPENSE')
    .reduce((s, e) => s + e.amountPhp, 0);
  const netPhp = salesPhp - expensesPhp;

  // Top product across today's Orders (Req 5.4)
  const items = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: start, lte: end } } },
    include: { product: true },
  });

  const totals = new Map<string, { name: string; qty: number }>();
  for (const it of items) {
    const cur = totals.get(it.productId) ?? { name: it.product.name, qty: 0 };
    cur.qty += it.quantity;
    totals.set(it.productId, cur);
  }

  let topProduct: string | null = null;
  let topQty = 0;
  totals.forEach((v) => {
    if (v.qty > topQty) {
      topQty = v.qty;
      topProduct = v.name;
    }
  });

  return { salesPhp, expensesPhp, netPhp, topProduct };
}

export async function getLast7DaysChartData(): Promise<ChartDay[]> {
  const today = new Date();
  // oldest → today
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const start = startOfDay(days[0]);
  const end = endOfDay(days[6]);

  const entries = await prisma.journalEntry.findMany({
    where: { date: { gte: start, lte: end } },
  });

  return days.map((d) => {
    const day = startOfDay(d).getTime();
    const revenue = entries
      .filter(
        (e) => startOfDay(e.date).getTime() === day && e.type === 'REVENUE',
      )
      .reduce((s, e) => s + e.amountPhp, 0);
    const expense = entries
      .filter(
        (e) => startOfDay(e.date).getTime() === day && e.type === 'EXPENSE',
      )
      .reduce((s, e) => s + e.amountPhp, 0);
    return {
      dayLabel: format(d, 'EEE') as DayLabel,
      revenue,
      expense,
    };
  });
}
