"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useT } from "@/lib/language-context";
import { AppHeader } from "@/components/AppHeader";

/**
 * `/finance/new` — Tier 1 manual JournalEntry form (Reqs 4.3, 4.4, 4.5, 4.6,
 * 4.7, 9.6, 17.4).
 *
 * Client component because it owns local form state, posts to
 * `/api/journal`, and reads the optional `?type=REVENUE` query parameter
 * used by the Dashboard_Tab Log Sale quick action (task 9.2).
 *
 * All user-facing copy is routed through `useT()` (see `lib/strings.ts`).
 *
 * Inline field error mapping uses the zod issue paths returned by the
 * route handler's 400 response shape `{ error, issues: ZodIssue[] }`. Each
 * issue's `path[0]` keys into `fieldErrors`, surfacing the message under
 * the matching input. This covers Req 4.5 (non-positive amount) and
 * Req 4.6 (missing required field) without duplicating server validation.
 *
 * `useSearchParams` requires a `Suspense` boundary in the Next.js 14 App
 * Router, so the page default-export wraps the inner form component.
 */

type EntryType = "REVENUE" | "EXPENSE";

type FieldErrors = {
  date?: string;
  type?: string;
  category?: string;
  amountPhp?: string;
  note?: string;
};

type ZodIssue = {
  path: (string | number)[];
  message: string;
};

type JournalErrorBody = {
  error?: string;
  issues?: ZodIssue[];
};

function isEntryType(v: string | null): v is EntryType {
  return v === "REVENUE" || v === "EXPENSE";
}

function todayLocalIso(): string {
  // YYYY-MM-DD in the device's local time zone — matches the value
  // shape produced by `<input type="date">` and the `z.coerce.date()`
  // schema's accepted input.
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function NewEntryForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType: EntryType = useMemo(() => {
    const raw = searchParams.get("type");
    return isEntryType(raw) ? raw : "EXPENSE";
  }, [searchParams]);

  const [date, setDate] = useState<string>(() => todayLocalIso());
  const [type, setType] = useState<EntryType>(initialType);
  const [category, setCategory] = useState<string>("");
  const [amountPhp, setAmountPhp] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setFieldErrors({});

    // Parse the amount on the client, but pass NaN through as-is — the
    // server-side zod schema will reject and surface an inline error.
    const parsedAmount = amountPhp.trim() === "" ? NaN : Number(amountPhp);

    const payload: {
      date: string;
      type: EntryType;
      category: string;
      amountPhp: number;
      note?: string;
    } = {
      date,
      type,
      category,
      amountPhp: parsedAmount,
      ...(note.trim() === "" ? {} : { note }),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t("entry_success_toast"));
        router.push("/finance");
        return;
      }

      if (res.status === 400) {
        let body: JournalErrorBody = {};
        try {
          body = (await res.json()) as JournalErrorBody;
        } catch {
          // ignore parse failure
        }
        const next: FieldErrors = {};
        for (const issue of body.issues ?? []) {
          const key = issue.path[0];
          if (typeof key !== "string") continue;
          if (
            key === "date" ||
            key === "type" ||
            key === "category" ||
            key === "amountPhp" ||
            key === "note"
          ) {
            // First-issue-wins per field — matches typical zod ordering.
            if (!next[key]) {
              next[key] = issue.message;
            }
          }
        }
        setFieldErrors(next);
        return;
      }

      toast.error(t("error_save"));
    } catch (err) {
      console.error("[/finance/new] submit failed", err);
      toast.error(t("error_save"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader
        title={t("heading_finance_new")}
        subtitle={t("subtitle_finance_new")}
      />
      <main className="flex flex-col gap-4 px-4 py-4 pb-32">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
          aria-busy={submitting}
        >
          {/* Date */}
          <div className="flex flex-col gap-1">
            <label htmlFor="entry-date" className="text-sm font-medium text-ink">
              {t("form_label_date")}
            </label>
            <input
              id="entry-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
              aria-invalid={fieldErrors.date ? "true" : "false"}
              className="input-touch"
            />
            {fieldErrors.date ? (
              <p className="text-xs text-danger">{fieldErrors.date}</p>
            ) : null}
          </div>

          {/* Type */}
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
                      name="type"
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
            {fieldErrors.type ? (
              <p className="text-xs text-danger">{fieldErrors.type}</p>
            ) : null}
          </fieldset>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="entry-category"
              className="text-sm font-medium text-ink"
            >
              {t("form_label_category")}
            </label>
            <input
              id="entry-category"
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              placeholder={t("placeholder_category")}
              aria-invalid={fieldErrors.category ? "true" : "false"}
              className="input-touch placeholder:text-muted/60"
            />
            {fieldErrors.category ? (
              <p className="text-xs text-danger">{fieldErrors.category}</p>
            ) : null}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="entry-amount"
              className="text-sm font-medium text-ink"
            >
              {t("form_label_amount_php")}
            </label>
            <input
              id="entry-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amountPhp}
              onChange={(e) => setAmountPhp(e.target.value)}
              disabled={submitting}
              placeholder="0.00"
              aria-invalid={fieldErrors.amountPhp ? "true" : "false"}
              className="input-touch placeholder:text-muted/60"
            />
            {fieldErrors.amountPhp ? (
              <p className="text-xs text-danger">{fieldErrors.amountPhp}</p>
            ) : null}
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1">
            <label htmlFor="entry-note" className="text-sm font-medium text-ink">
              {t("form_label_note")}
            </label>
            <textarea
              id="entry-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              placeholder={t("placeholder_note_optional")}
              aria-invalid={fieldErrors.note ? "true" : "false"}
              className="input-touch placeholder:text-muted/60"
            />
            {fieldErrors.note ? (
              <p className="text-xs text-danger">{fieldErrors.note}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="btn-primary mt-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                <span>{t("loading")}</span>
              </>
            ) : (
              t("form_btn_save")
            )}
          </button>
        </form>
      </main>
    </>
  );
}

export default function NewEntryPage() {
  return (
    <Suspense fallback={null}>
      <NewEntryForm />
    </Suspense>
  );
}
