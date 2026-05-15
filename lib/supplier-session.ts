const STORAGE_KEY = "carinderai-selected-supplier";

export type StoredSupplier = {
  id: string;
  name: string;
};

export function setSelectedSupplier(supplier: StoredSupplier): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(supplier));
}

export function getSelectedSupplier(): StoredSupplier | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as StoredSupplier).id === "string" &&
      typeof (parsed as StoredSupplier).name === "string"
    ) {
      return parsed as StoredSupplier;
    }
  } catch {
    /* ignore */
  }
  return null;
}
