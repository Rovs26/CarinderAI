import type { Supplier } from "@/lib/mock-data";
import { formatPeso } from "@/lib/utils";

type SupplierCardProps = {
  supplier: Supplier;
  selected?: boolean;
  onCreateOrder?: () => void;
};

export function SupplierCard({ supplier, selected, onCreateOrder }: SupplierCardProps) {
  return (
    <article
      className={`card transition-all ${selected ? "ring-2 ring-[var(--color-accent)] card-warm" : ""}`}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{supplier.name}</h3>
        <span className="text-sm text-[var(--color-muted)]">★ {supplier.rating}</span>
      </header>
      <p className="mt-2 flex flex-wrap gap-1.5">
        {supplier.categories.map((cat) => (
          <span
            key={cat}
            className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-medium text-stone-700"
          >
            {cat}
          </span>
        ))}
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs text-[var(--color-muted)]">Minimum order</dt>
          <dd className="font-medium">{formatPeso(supplier.minimumOrder)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-muted)]">Delivery</dt>
          <dd className="font-medium">{supplier.deliveryArea}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-muted)]">Products</dt>
          <dd className="text-sm">{supplier.exampleProducts.join(", ")}</dd>
        </div>
      </dl>
      {selected ? (
        <p className="mt-4 rounded-xl bg-emerald-50/90 px-3 py-2.5 text-center text-sm font-medium text-emerald-800">
          Supplier selected for order draft
        </p>
      ) : (
        <button type="button" onClick={onCreateOrder} className="btn-primary mt-4 text-sm !py-3">
          Create order
        </button>
      )}
    </article>
  );
}
