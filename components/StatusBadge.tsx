type Status = "available" | "limited" | "sold_out" | "low" | "normal" | "high";

const styles: Record<Status, string> = {
  available: "bg-emerald-50 text-emerald-700",
  limited: "bg-amber-50 text-amber-700",
  sold_out: "bg-stone-100 text-stone-600",
  low: "bg-stone-100 text-stone-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-[var(--color-accent)]",
};

const labels: Record<Status, string> = {
  available: "Available",
  limited: "Limited",
  sold_out: "Sold out",
  low: "Low demand",
  normal: "Normal demand",
  high: "High demand",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
