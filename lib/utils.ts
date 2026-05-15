export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
