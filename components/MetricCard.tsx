type MetricCardProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  compact?: boolean;
};

export function MetricCard({ label, value, sub, accent, compact }: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-white shadow-sm ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className="text-xs font-medium text-[var(--color-muted)]">{label}</p>
      <p
        className={`mt-0.5 font-semibold leading-tight ${
          compact ? "text-lg" : "text-xl"
        } ${accent ? "text-[var(--color-accent)]" : "text-[var(--color-foreground)]"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">{sub}</p>}
    </div>
  );
}
