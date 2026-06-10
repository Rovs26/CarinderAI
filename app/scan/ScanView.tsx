"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { AppHeader } from "@/components/AppHeader";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { WebcamCapture } from "@/components/WebcamCapture";
import { EditableItemList } from "./components/EditableItemList";
import { OcrResult, type OcrItem } from "@/lib/schemas";
import {
  buildFuseIndex,
  matchOcrItems,
  type MatcherProduct,
} from "@/lib/matcher";
import { useCart } from "@/lib/cart-store";
import type { CartLine, UnmatchedLine } from "@/lib/cart-store";
import { useT } from "@/lib/language-context";

export interface ScanViewProps {
  products: MatcherProduct[];
}

/**
 * `/scan` client island (Reqs 6.1–6.8, 8.1–8.5, 17.1, 17.2, 17.4).
 *
 * Owns local state for the OCR result list, the in-flight submission flag,
 * and the file inputs. Both controls (camera capture and file upload) post
 * to `POST /api/scan` as `multipart/form-data` with field `image` and feed
 * the parsed `OcrResult.items` into `EditableItemList`.
 *
 * The product list is fetched once by the parent RSC and passed in via the
 * `products` prop. We build the Fuse.js index lazily with `useMemo` so it
 * is constructed exactly once per `products` reference rather than on every
 * render.
 *
 * Task 7.9 wires "Log as Expense": tapping the button opens a small inline
 * dialog asking for a positive `amountPhp`. On submit we POST a single
 * `JournalEntry` to `/api/journal` with `type='EXPENSE'`, `category='Palengke'`
 * and a note summarising the scanned items. On success we toast the Tagalog
 * confirmation copy ("Tapos na!") and navigate to `/finance`.
 */

/**
 * Build a short human-readable note for a "Log as Expense" journal entry.
 *
 * Emits "Palengke: <up to 3 items>" with each item formatted as
 * "<qty> <unit> <name>", followed by " +N more" when more than 3 items
 * were scanned. Falls back to the bare "Palengke" string when the list
 * is empty so the route handler still receives a meaningful note.
 *
 * The "Palengke" prefix is load-bearing — Req 8.4 specifies the journal
 * `category` is "Palengke", and the smoke check for this task asserts
 * the note starts with "Palengke".
 */
function buildScanSummary(items: OcrItem[]): string {
  if (items.length === 0) return "Palengke";
  const head = items.slice(0, 3).map((it) => {
    return `${String(it.quantity)} ${it.unit} ${it.name}`.trim();
  });
  const overflow = items.length - 3;
  const tail = overflow > 0 ? ` +${overflow} more` : "";
  return `Palengke: ${head.join(", ")}${tail}`;
}

export function ScanView({ products }: ScanViewProps) {
  const t = useT();
  const router = useRouter();
  const prefillFromScan = useCart((s) => s.prefillFromScan);

  const fuse = useMemo(() => buildFuseIndex(products), [products]);

  const [items, setItems] = useState<OcrItem[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  // Tracks whether at least one scan request has resolved this session.
  // Used to decide whether to show the upload controls (first visit) or
  // the empty-state (Req 6.7) when items is empty.
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  // Toggle between file-picker controls and the live webcam surface.
  // Persists in component state only — does not survive remount.
  const [useCamera, setUseCamera] = useState<boolean>(false);

  // Task 7.9 — "Log as Expense" dialog state.
  const [logging, setLogging] = useState<boolean>(false);
  const [showLogDialog, setShowLogDialog] = useState<boolean>(false);
  const [logAmount, setLogAmount] = useState<string>("");

  const reset = () => {
    setItems([]);
    setHasScanned(false);
    setSubmitting(false);
  };

  /**
   * Shared upload path used by both the file picker (camera/gallery) and
   * the WebcamCapture component. Accepts any Blob — File is a Blob, so
   * the existing upload handler funnels straight through.
   */
  const submitImage = async (file: Blob) => {
    const fd = new FormData();
    fd.set("image", file);

    setSubmitting(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        toast.error(t("error_scan"));
        return;
      }

      let parsedItems: OcrItem[] = [];
      try {
        const body = (await res.json()) as unknown;
        const parsed = OcrResult.safeParse(body);
        if (parsed.success) {
          parsedItems = parsed.data.items;
        }
      } catch {
        // Fall through to empty list — the route already validates, but
        // a malformed body shouldn't crash the page.
      }
      setItems(parsedItems);
    } catch (err) {
      console.error("[/scan] submit failed", err);
      toast.error(t("error_scan"));
    } finally {
      setSubmitting(false);
      setHasScanned(true);
    }
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so the same file can be re-picked after a retake.
    e.target.value = "";
    if (!file) return;
    await submitImage(file);
  };

  const handleWebcamFrame = (blob: Blob) => {
    void submitImage(blob);
  };

  /** Append a blank editable row so the user can manually add an item. */
  const addBlankRow = () => {
    setItems((prev) => [
      ...prev,
      { name: "", quantity: 1, unit: "pc" as const },
    ]);
  };

  // Task 7.8 — Match scanned items to seeded Products via Fuse.js, prefill
  // the cart store with both matched and unmatched lines, and navigate to
  // `/market/cart` for review and checkout.
  const handleMatchToMarket = () => {
    if (items.length === 0) return;

    const { matched, unmatched } = matchOcrItems(fuse, items);

    const cartLines: CartLine[] = matched.map((m) => ({
      productId: m.product.id,
      name: m.product.name,
      unit: m.product.unit,
      pricePhp: m.product.pricePhp,
      imageUrl: m.product.imageUrl,
      // matcher already clamps quantity to ≥ 0.01 — keep the call defensively
      // so the Cart invariant (Req 3.2) is enforced at the boundary too.
      quantity: Math.max(0.01, m.quantity),
    }));

    const unmatchedLines: UnmatchedLine[] = unmatched.map((u) => ({
      name: u.ocrItem.name,
      quantity: u.ocrItem.quantity,
      unit: u.ocrItem.unit,
      note: u.ocrItem.note,
    }));

    prefillFromScan(cartLines, unmatchedLines);
    router.push("/market/cart");
  };

  // Task 7.9 — opens the inline "Log as Expense" dialog with a fresh amount.
  const handleLogAsExpense = () => {
    setLogAmount("");
    setShowLogDialog(true);
  };

  const closeLogDialog = () => {
    if (logging) return; // don't allow dismissal mid-flight
    setShowLogDialog(false);
    setLogAmount("");
  };

  const submitLogAsExpense = async () => {
    const amountPhp = Number(logAmount);
    if (Number.isNaN(amountPhp) || amountPhp <= 0) return;

    setLogging(true);
    const note = buildScanSummary(items);

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          type: "EXPENSE",
          category: "Palengke",
          amountPhp,
          note,
        }),
      });

      if (!res.ok) {
        toast.error(t("error_save"));
        return;
      }

      toast.success(t("entry_success_toast"));
      setShowLogDialog(false);
      setLogAmount("");
      router.push("/finance");
    } catch (err) {
      console.error("[/scan] log-as-expense failed", err);
      toast.error(t("error_save"));
    } finally {
      setLogging(false);
    }
  };

  const hasItems = items.length > 0;
  const showEmptyState = !submitting && !hasItems && hasScanned;
  const showUploadPanel = !submitting && !hasItems && !hasScanned;
  const actionsDisabled = !hasItems || submitting || logging;

  return (
    <>
      <AppHeader title={t("heading_scan")} subtitle={t("subtitle_scan")} />
      <div className="flex flex-col pb-32">
        {submitting ? <Spinner label={t("loading")} /> : null}

      {showEmptyState ? (
        <EmptyState
          title={t("empty_scan_title")}
          body={t("empty_scan_body")}
          cta={
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              {t("retake")}
            </button>
          }
        />
      ) : null}

      {showUploadPanel ? (
        <section
          aria-label="Upload controls"
          className="flex flex-col gap-4 px-4 pt-4"
        >
          {/* Segmented control: Upload photo (default) vs Use camera.
              These are honest paths now — the file input no longer
              pretends to be a camera capture on desktop. */}
          <div
            role="radiogroup"
            aria-label="Capture mode"
            className="grid grid-cols-2 gap-2"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!useCamera}
              onClick={() => setUseCamera(false)}
              className={`pill w-full justify-center !py-1.5 ${!useCamera ? "pill-active" : ""}`}
            >
              {t("scan_mode_upload")}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={useCamera}
              onClick={() => setUseCamera(true)}
              className={`pill w-full justify-center !py-1.5 ${useCamera ? "pill-active" : ""}`}
            >
              {t("scan_mode_camera")}
            </button>
          </div>

          {useCamera ? (
            <WebcamCapture
              onCapture={handleWebcamFrame}
              onError={(msg) => toast.error(msg)}
            />
          ) : (
            <label className="upload-zone h-[200px] cursor-pointer text-center transition-colors hover:border-primary">
              <span aria-hidden="true" className="text-5xl">
                🖼️
              </span>
              <span className="text-base font-semibold text-ink">
                {t("scan_upload_label")}
              </span>
              <span className="text-xs text-muted">
                {t("scan_upload_hint")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={handleFileSelected}
                disabled={submitting}
              />
            </label>
          )}
        </section>
      ) : null}

      {hasItems ? (
        <section aria-label="Scanned items" className="pt-4">
          <div className="flex items-center justify-between px-4 pb-2">
            <span className="text-sm font-medium text-ink">
              {items.length} {t("scan_items_detected")}
            </span>
            <button
              type="button"
              onClick={addBlankRow}
              className="btn-ghost"
            >
              {t("scan_add_row")}
            </button>
          </div>
          <EditableItemList items={items} onChange={setItems} />
        </section>
      ) : null}

      {hasItems ? (
        <div className="bottom-bar fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] flex-col gap-2 px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={handleMatchToMarket}
            disabled={actionsDisabled}
            className="btn-primary disabled:opacity-50"
          >
            {t("cta_match")}
          </button>
          <button
            type="button"
            onClick={handleLogAsExpense}
            disabled={actionsDisabled}
            className="btn-secondary !text-primary !border-primary disabled:opacity-50"
          >
            {t("cta_log_expense")}
          </button>
        </div>
      ) : null}

      {showLogDialog ? (
        <>
          <div
            role="presentation"
            onClick={closeLogDialog}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-expense-title"
            className="card fixed inset-x-0 top-0 z-50 mx-auto mt-32 max-w-[400px] !p-6"
          >
            <h2
              id="log-expense-title"
              className="text-base font-semibold text-ink"
            >
              {t("cta_log_expense")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("log_dialog_subtitle")}
            </p>
            <label
              htmlFor="log-amount"
              className="mt-4 block text-xs font-medium text-muted"
            >
              {t("form_label_amount_php")}
            </label>
            <input
              id="log-amount"
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              inputMode="decimal"
              aria-label="Total amount in pesos"
              value={logAmount}
              onChange={(e) => setLogAmount(e.target.value)}
              disabled={logging}
              placeholder="0.00"
              className="input-touch mt-1 placeholder:text-muted/60"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeLogDialog}
                disabled={logging}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                {t("cta_dismiss")}
              </button>
              <button
                type="button"
                onClick={submitLogAsExpense}
                disabled={
                  logging ||
                  logAmount.trim() === "" ||
                  Number.isNaN(Number(logAmount)) ||
                  Number(logAmount) <= 0
                }
                aria-busy={logging}
                className="btn-primary flex-1 !py-2 !text-sm disabled:opacity-50"
              >
                {logging ? (
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
            </div>
          </div>
        </>
      ) : null}
      </div>
    </>
  );
}
