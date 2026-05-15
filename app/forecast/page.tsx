"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  computeForecast,
  type DayType,
  type LocationType,
  type WeatherType,
} from "@/lib/mock-data";
import { formatPeso } from "@/lib/utils";

export default function ForecastPage() {
  const [location, setLocation] = useState<LocationType>("office");
  const [dayType, setDayType] = useState<DayType>("weekday");
  const [weather, setWeather] = useState<WeatherType>("sunny");
  const [customers, setCustomers] = useState(55);
  const [result, setResult] = useState<ReturnType<typeof computeForecast> | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(computeForecast(location, dayType, weather, customers));
  };

  return (
    <AppShell title="Forecast" subtitle="Plan tomorrow's prep">
      <form onSubmit={submit} className="card space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-muted)]">Location</span>
          <select
            className="input-touch mt-1.5"
            value={location}
            onChange={(e) => setLocation(e.target.value as LocationType)}
          >
            <option value="school">Near school</option>
            <option value="office">Near office</option>
            <option value="residential">Residential</option>
            <option value="market">Market area</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-muted)]">Tomorrow</span>
          <select
            className="input-touch mt-1.5"
            value={dayType}
            onChange={(e) => setDayType(e.target.value as DayType)}
          >
            <option value="weekday">Weekday</option>
            <option value="weekend">Weekend</option>
            <option value="holiday">Holiday</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-muted)]">Weather</span>
          <select
            className="input-touch mt-1.5"
            value={weather}
            onChange={(e) => setWeather(e.target.value as WeatherType)}
          >
            <option value="sunny">Sunny</option>
            <option value="rainy">Rainy</option>
            <option value="stormy">Stormy</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-muted)]">
            Expected customers today
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="input-touch mt-1.5"
            value={customers}
            onChange={(e) => setCustomers(Number(e.target.value) || 0)}
          />
        </label>
        <button type="submit" className="btn-primary">
          Generate forecast
        </button>
      </form>

      {result && (
        <article className="card mt-4 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Recommendation</h3>
            <StatusBadge status={result.demand} />
          </div>
          <p className="mt-4 text-sm leading-relaxed">{result.prepLevel}</p>
          <p className="mt-3 text-sm">
            <span className="text-[var(--color-muted)]">Ingredient budget: </span>
            <strong className="text-[var(--color-accent)]">
              {formatPeso(result.ingredientBudget)}
            </strong>
          </p>
          <ul className="mt-4 space-y-2 border-t border-orange-200/80 pt-3 text-sm text-stone-700">
            {result.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="text-[var(--color-accent)]">•</span>
                {note}
              </li>
            ))}
          </ul>
        </article>
      )}
    </AppShell>
  );
}
