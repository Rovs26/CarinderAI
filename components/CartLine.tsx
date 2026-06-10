"use client";

import { useCart, type CartLine as CartLineModel } from "@/lib/cart-store";
import { formatPhp } from "@/lib/currency";

export interface CartLineProps {
  line: CartLineModel;
}

/**
 * Cart row used on `/market/cart`. Renders the product's emoji glyph and
 * name on the left, a quantity stepper (`−` / numeric input / `+`) plus
 * line total and a remove (`×`) button on the right.
 *
 * Quantities are positive floats ≥ 0.01; the store clamps the value, but
 * the `−` handler also short-circuits to keep the displayed value stable.
 */
export function CartLine({ line }: CartLineProps) {
  const setQuantity = useCart((s) => s.setQuantity);
  const removeProduct = useCart((s) => s.removeProduct);

  const handleDecrement = () => {
    const next = line.quantity - 1;
    setQuantity(line.productId, next < 0.01 ? 0.01 : next);
  };

  const handleIncrement = () => {
    setQuantity(line.productId, line.quantity + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (Number.isNaN(parsed)) return;
    setQuantity(line.productId, parsed);
  };

  const handleRemove = () => {
    removeProduct(line.productId);
  };

  const lineTotal = line.pricePhp * line.quantity;

  return (
    <div className="card-flat flex items-center gap-3">
      <span className="text-2xl leading-none" aria-hidden="true">
        {line.imageUrl}
      </span>
      <span className="flex-1 text-sm font-medium text-ink">{line.name}</span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Decrease ${line.name} quantity`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-section text-ink hover:bg-border-strong"
        >
          −
        </button>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={line.quantity}
          onChange={handleInputChange}
          aria-label={`${line.name} quantity`}
          className="w-16 rounded-md border border-border-strong px-1 py-0.5 text-center text-sm text-ink"
        />
        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase ${line.name} quantity`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-section text-ink hover:bg-border-strong"
        >
          +
        </button>
      </div>

      <span className="text-sm font-semibold text-primary">
        {formatPhp(lineTotal)}
      </span>

      <button
        type="button"
        onClick={handleRemove}
        aria-label={`Remove ${line.name} from cart`}
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-section hover:text-danger"
      >
        ×
      </button>
    </div>
  );
}
