"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AppHeader } from "@/components/AppHeader";
import { BarChart7d, type BarChart7dDatum } from "@/components/BarChart7d";
import { EmptyState } from "@/components/EmptyState";
import { JournalRow, type JournalRowEntry } from "@/components/JournalRow";
import { KpiCard } from "@/components/KpiCard";
import { useT } from "@/lib/language-context";

export interface FinanceJournalEntryView {
  id: string;
  /** ISO string serialized at the RSC boundary. */
  date: string;
  type: "REVENUE" | "EXPENSE";
  category: string;
  amountPhp: number;
  note: string | null;
  /** When non-null, the entry was written by POST /api/orders and is locked. */
  sourceOrderId: string | null;
}

export type FinanceChartPoint = BarChart7dDatum;

export interface FinanceViewProps {
  salesPhp: number;
  expensesPhp: number;
  netPhp: number;
  topProduct: string | null;
  chart: FinanceChartPoint[];
  entries: FinanceJournalEntryView[];
}

type EntryType = "REVENUE" | "EXPENSE";

/**
 * Client island for `/finance`.
 *
 * In addition to rendering chrome that needs `useT()`, it now owns the
 * modal state for per-row Edit and Delete actions:
 *   - `editingEntry` opens a form modal pre-filled with the row, posting
 *     PATCH `/api/journal/[id]` on save.
 *   - `deletingEntry` opens a confirmation modal that DELETEs the row.
 *
 * After every successful mutation we call `router.refresh()` so the
 * server component re-fetches KPIs, chart, and the journal list — that
 * preserves scroll position while reflecting the new state.
 */
export function FinanceView({
  salesPhp,
  expensesPhp,
  netPhp,
  topProduct,
  chart,
  entries,
}: FinanceViewProps) {
  const t = useT();
  const router = useRouter();

  const [editingEntry, setEditingEntry] =
    useState<FinanceJournalEntryView | null>(null);
  const [deletingEntry, setDeletingEntry] =
    useState<FinanceJournalEntryView | null>(null);

  const handleEditRequest = (e: JournalRowEntry) => {
    const match = entries.find((entry) => entry.id === e.id);
    if (match) setEditingEntry(match);
  };

  const handleDeleteRequest = (e: JournalRowEntry) => {
    const match = entries.find((entry) => entry.id === e.id);
    if (match) setDeletingEntry(match);
  };

  return (
    <main className="flex flex-col gap-4 pb-6">
      <AppHeader
        title={t("heading_finance")}
        subtitle={t("subtitle_finance")}
        trailing={
          <Link href="/finance/new" className="btn-ghost">
            {t("cta_new_entry")}
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-2 px-4">
        <KpiCard label={t("kpi_sales_today")} valuePhp={salesPhp} />
        <KpiCard label={t("kpi_expenses_today")} valuePhp={expensesPhp} />
        <KpiCard label={t("kpi_net_today")} valuePhp={netPhp} />
        <KpiCard
          label={t("kpi_top_product")}
          value={topProduct ?? t("top_product_placeholder")}
        />
      </section>

      <div className="section-band" />
      <section className="px-4 py-3">
        <div className="card !p-2">
          <BarChart7d data={chart} />
        </div>
      </section>
      <div className="section-band" />

      <section className="flex flex-col">
        <h2 className="px-4 pb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("journal_section_heading")}
        </h2>
        {entries.length === 0 ? (
          <EmptyState
            title={t("empty_journal_title")}
            body={t("empty_journal")}
          />
        ) : (
          <div className="flex flex-col">
            {entries.map((e) => (
              <JournalRow
                key={e.id}
                entry={{
                  id: e.id,
                  date: e.date,
                  type: e.type,
                  category: e.category,
                  amountPhp: e.amountPhp,
                  note: e.note,
                  sourceOrderId: e.sourceOrderId,
                }}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </section>

      {editingEntry ? (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            router.refresh();
          }}
        />
      ) : null}

      {deletingEntry ? (
        <DeleteEntryModal
          entry={deletingEntry}
          onClose={() => setDeletingEntry(null)}
          onDeleted={() => {
            setDeletingEntry(null);
            router.refresh();
          }}
        />
      ) : null}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

interface EditEntryModalProps {
  entry: FinanceJournalEntryView;
  onClose: () => void;
  onSaved: () => void;
}

/** Convert an ISO datetime to the `YYYY-MM-DD` string that `<input type="date">` expects. */
function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function EditEntryModal({ entry, onClose, onSaved }: EditEntryModalProps) {
  const t = useT();

  const [date, setDate] = useState(() => toDateInputValue(entry.date));
  const [type, setType] = useState<EntryType>(entry.type);
  const [category, setCategory] = useState(entry.category);
  const [amountPhp, setAmountPhp] = useState(String(entry.amountPhp));
  const [note, setNote] = useState(entry.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Re-prefill if the modal is reused for a different entry — keeps form
  // state in sync without relying on key={entry.id} on the modal.
  useEffect(() => {
    setDate(toDateInputValue(entry.date));
    setType(entry.type);
    setCategory(entry.category);
    setAmountPhp(String(entry.amountPhp));
    setNote(entry.note ?? "");
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const parsedAmount = amountPhp.trim() === "" ? NaN : Number(amountPhp);

    const payload: {
      date: string;
      type: EntryType;
      category: string;
      amountPhp: number;
      note: string | null;
    } = {
      date,
      type,
      category,
      amountPhp: parsedAmount,
      note: note.trim() === "" ? null : note,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/journal/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t("journal_updated_toast"));
        onSaved();
        return;
      }

      if (res.status === 409) {
        toast.error(t("journal_auto_generated_lock"));
        onClose();
        return;
      }

      toast.error(t("error_save"));
    } catch (err) {
      console.error("[/finance] edit failed", err);
      toast.error(t("error_save"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        role="presentation"
        onClick={submitting ? undefined : onClose}
        className="fixed inset-0 z-40 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-entry-title"
        className="card fixed inset-x-0 top-32 z-50 mx-auto max-w-[400px] !p-6"
      >
        <h2
          id="edit-entry-title"
          className="text-base font-semibold text-ink"
        >
          {t("journal_edit_title")}
        </h2>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-4 flex flex-col gap-4"
          aria-busy={submitting}
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-date"
              className="text-sm font-medium text-ink"
            >
              {t("form_label_date")}
            </label>
            <input
              id="edit-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
              className="input-touch"
            />
          </div>

          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium text-ink">
              {t("form_label_type")}
            </legend>
            <div
              role="radiogroup"
              aria-label="Entry type"
              className="grid grid-cols-2 gap-2"
            >
              {(["REVENUE", "EXPENSE"] as const).map((opt) => {
                const active = type === opt;
                return (
                  <label
                    key={opt}
                    className={`pill w-full justify-center cursor-pointer transition-colors ${
                      active ? "pill-active" : ""
                    } ${submitting ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="edit-type"
                      value={opt}
                      checked={active}
                      onChange={() => setType(opt)}
                      disabled={submitting}
                      className="sr-only"
                    />
                    {opt === "REVENUE"
                      ? t("entry_type_revenue")
                      : t("entry_type_expense")}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-category"
              className="text-sm font-medium text-ink"
            >
              {t("form_label_category")}
            </label>
            <input
              id="edit-category"
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              className="input-touch placeholder:text-muted/60"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-amount"
              className="text-sm font-medium text-ink"
            >
              {t("form_label_amount_php")}
            </label>
            <input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amountPhp}
              onChange={(e) => setAmountPhp(e.target.value)}
              disabled={submitting}
              className="input-touch placeholder:text-muted/60"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="edit-note"
              className="text-sm font-medium text-ink"
            >
              {t("form_label_note")}
            </label>
            <textarea
              id="edit-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              placeholder={t("placeholder_note_optional")}
              className="input-touch placeholder:text-muted/60"
            />
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              {t("journal_cancel")}
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                amountPhp.trim() === "" ||
                Number.isNaN(Number(amountPhp)) ||
                Number(amountPhp) <= 0
              }
              aria-busy={submitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  <span className="ml-2">{t("loading")}</span>
                </>
              ) : (
                t("journal_save")
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

interface DeleteEntryModalProps {
  entry: FinanceJournalEntryView;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteEntryModal({
  entry,
  onClose,
  onDeleted,
}: DeleteEntryModalProps) {
  const t = useT();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/journal/${entry.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(t("journal_deleted_toast"));
        onDeleted();
        return;
      }

      if (res.status === 409) {
        toast.error(t("journal_auto_generated_lock"));
        onClose();
        return;
      }

      toast.error(t("error_save"));
    } catch (err) {
      console.error("[/finance] delete failed", err);
      toast.error(t("error_save"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        role="presentation"
        onClick={submitting ? undefined : onClose}
        className="fixed inset-0 z-40 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-entry-title"
        className="card fixed inset-x-0 top-32 z-50 mx-auto max-w-[400px] !p-6"
      >
        <h2
          id="delete-entry-title"
          className="text-base font-semibold text-ink"
        >
          {t("journal_delete_confirm_title")}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {t("journal_delete_confirm_body")}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            {t("journal_cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            aria-busy={submitting}
            className="btn-primary flex-1 disabled:opacity-50"
            style={{ background: "#ef4444" }}
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                <span className="ml-2">{t("loading")}</span>
              </>
            ) : (
              t("journal_delete_confirm_cta")
            )}
          </button>
        </div>
      </div>
    </>
  );
}
