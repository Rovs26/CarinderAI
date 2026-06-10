"use client";

import { formatPhp } from "@/lib/currency";
import { useT } from "@/lib/language-context";

export interface JournalRowEntry {
  id: string;
  /** Either an ISO string (when serialized through an RSC boundary) or a Date. */
  date: string | Date;
  type: "REVENUE" | "EXPENSE";
  category: string;
  amountPhp: number;
  note?: string | null;
  /**
   * When non-null, the entry is auto-generated from an Order checkout
   * (e.g. POST /api/orders writes a paired EXPENSE row). These rows are
   * locked from edit/delete so the journal can't drift away from the
   * source ledger.
   */
  sourceOrderId?: string | null;
}

export interface JournalRowProps {
  entry: JournalRowEntry;
  /** Open the edit modal for this entry. Ignored when the entry is locked. */
  onEdit?: (entry: JournalRowEntry) => void;
  /** Open the delete-confirm modal for this entry. Ignored when locked. */
  onDelete?: (entry: JournalRowEntry) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
});

/**
 * Single journal row used on `/finance`. Originally a presentational
 * server-safe component; now a client component because it renders
 * action affordances (edit / delete) and surfaces the lock state for
 * auto-generated rows.
 *
 * Layout: `[date] [type pill] [category] ……………… [amount] [actions]`
 * with an optional one-line `note` underneath, truncated with
 * `line-clamp-1`.
 *
 * Actions render as compact icon buttons on the right edge:
 *   - Editable rows: ✏️ Edit + 🗑️ Delete (separate `bg-section` icon
 *     buttons that emit through the parent-supplied callbacks).
 *   - Locked rows: a single 🔒 icon with the localized lock tooltip,
 *     fully disabled.
 */
export function JournalRow({ entry, onEdit, onDelete }: JournalRowProps) {
  const t = useT();

  const dateLabel = dateFormatter.format(new Date(entry.date));
  const isRevenue = entry.type === "REVENUE";
  const pillClasses = isRevenue
    ? "bg-success/10 text-success"
    : "bg-danger/10 text-danger";
  const amountClasses = isRevenue ? "text-success" : "text-danger";
  const hasNote = typeof entry.note === "string" && entry.note.length > 0;
  const isLocked = entry.sourceOrderId != null;

  return (
    <div className="card-flat flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted whitespace-nowrap">{dateLabel}</span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pillClasses}`}
        >
          {entry.type}
        </span>
        <span className="flex-1 text-sm text-ink truncate">{entry.category}</span>
        <span className={`text-sm font-semibold ${amountClasses}`}>
          {formatPhp(entry.amountPhp)}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {isLocked ? (
            <button
              type="button"
              disabled
              aria-label={t("journal_auto_generated_lock")}
              title={t("journal_auto_generated_lock")}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-section text-muted cursor-not-allowed"
            >
              <span aria-hidden="true">🔒</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit?.(entry)}
                aria-label={t("journal_edit")}
                title={t("journal_edit")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-section hover:text-ink"
              >
                <span aria-hidden="true">✏️</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(entry)}
                aria-label={t("journal_delete")}
                title={t("journal_delete")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger"
              >
                <span aria-hidden="true">🗑️</span>
              </button>
            </>
          )}
        </div>
      </div>
      {hasNote ? (
        <p className="text-xs text-muted line-clamp-1">{entry.note}</p>
      ) : null}
    </div>
  );
}
