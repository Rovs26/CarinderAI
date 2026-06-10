import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  body: string;
  cta?: ReactNode;
}

/**
 * Centered, friendly empty-state slot used by every empty list view.
 *
 * Presentational only — callers supply the copy (typically Filipino strings
 * sourced via `useT`) and an optional CTA node such as a button or link.
 */
export function EmptyState({ title, body, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-2">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm text-muted max-w-xs">{body}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}
