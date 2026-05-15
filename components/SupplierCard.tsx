import type { Supplier } from "@/lib/mock-data";
import { formatPeso } from "@/lib/utils";

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  return (
    <article className="card">
      <header className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{supplier.name}</h3>
        <span className="text-sm text-[var(--color-muted)]">★ {supplier.rating}</span>
      </header>
      <p className="mt-2 flex flex-wrap gap-1.5">
        {supplier.categories.map((cat) => (
          <span
            key={cat}
            className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700"
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
      <button
        type="button"
        disabled
        className="mt-4 w-full rounded-xl border border-stone-200 bg-stone-50 py-3 text-sm font-medium text-[var(--color-muted)]"
      >
        Create order (soon)
      </button>
    </article>
  );
}
