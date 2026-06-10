import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  productId: string;
  name: string;
  unit: 'kg' | 'pc' | 'L' | 'pack';
  pricePhp: number;
  imageUrl: string;
  quantity: number; // positive float ≥ 0.01
}

export interface UnmatchedLine {
  name: string;
  quantity: number;
  unit: string;
  note?: string;
}

interface CartState {
  lines: CartLine[];
  unmatched: UnmatchedLine[];
  addProduct: (line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
  prefillFromScan: (matched: CartLine[], unmatched: UnmatchedLine[]) => void;
  totalPhp: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      unmatched: [],
      addProduct: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, quantity: l.quantity + qty }
                  : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: qty }] };
        }),
      setQuantity: (productId, qty) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.productId === productId
              ? { ...l, quantity: Math.max(0.01, qty) }
              : l,
          ),
        })),
      removeProduct: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),
      clear: () => set({ lines: [], unmatched: [] }),
      prefillFromScan: (matched, unmatched) =>
        set({ lines: matched, unmatched }),
      totalPhp: () =>
        get().lines.reduce((sum, l) => sum + l.pricePhp * l.quantity, 0),
    }),
    { name: 'carinderai.cart' },
  ),
);
