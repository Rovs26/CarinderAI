"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPhp } from "@/lib/currency";

export interface BarChart7dDatum {
  dayLabel: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  revenue: number;
  expense: number;
}

export interface BarChart7dProps {
  data: BarChart7dDatum[];
}

export function BarChart7d({ data }: BarChart7dProps) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dayLabel"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(v: number) => `₱${v}`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => {
              const n =
                typeof value === "number"
                  ? value
                  : Number(Array.isArray(value) ? value[0] : value);
              return formatPhp(Number.isFinite(n) ? n : 0);
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#2E7D32" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#C62828" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
