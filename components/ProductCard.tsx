"use client";

import { useCart } from "@/lib/cart-store";
import { formatPhp } from "@/lib/currency";
import { useT } from "@/lib/language-context";

export interface ProductCardProduct {
  id: string;
  name: string;
  unit: "kg" | "pc" | "L" | "pack";
  pricePhp: number;
  stock: number;
  imageUrl: string; // single emoji glyph per design
}

export interface ProductCardProps {
  product: ProductCardProduct;
}

/**
 * Product tile used on `/market`. Renders the product's emoji glyph, name,
 * unit, peso price, and stock, with an "Add to cart" button that dispatches
 * to the Zustand cart store. Disabled when stock is zero.
 */
export function ProductCard({ product }: ProductCardProps) {
  const t = useT();
  const addProduct = useCart((s) => s.addProduct);
  const outOfStock = product.stock === 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addProduct({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      pricePhp: product.pricePhp,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <div
      className={`card flex flex-col gap-1 ${outOfStock ? "opacity-60" : ""}`}
    >
      <span className="text-3xl leading-none" aria-hidden="true">
        {product.imageUrl}
      </span>
      <span className="text-sm font-semibold text-ink">{product.name}</span>
      <span className="text-xs text-muted">
        {product.unit} · stock {product.stock}
      </span>
      <span className="text-base font-bold text-primary">
        {formatPhp(product.pricePhp)}
      </span>
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="mt-2 rounded-lg bg-primary py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("cta_add_to_cart")}
      </button>
    </div>
  );
}
