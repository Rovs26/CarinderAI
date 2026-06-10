import { formatPhp } from "@/lib/currency";

export type KpiCardProps =
  | { label: string; value: string; valuePhp?: undefined }
  | { label: string; valuePhp: number; value?: undefined };

/**
 * Pure presentational KPI tile used on `/finance` and `/` (Dashboard_Tab).
 *
 * Callers either pass a pre-formatted `value` string (e.g. an already
 * `formatPhp`-ed peso amount or a free-text label like a top product name),
 * or a numeric `valuePhp` that this component formats via `formatPhp`.
 * The discriminated union prevents passing both at once.
 */
export function KpiCard(props: KpiCardProps) {
  const display =
    props.valuePhp !== undefined ? formatPhp(props.valuePhp) : props.value;

  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xs text-muted">{props.label}</span>
      <span className="text-lg font-semibold text-ink">{display}</span>
    </div>
  );
}
