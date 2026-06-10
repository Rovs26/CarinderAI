"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { WebcamCapture } from "@/components/WebcamCapture";
import { formatPhp } from "@/lib/currency";
import { useT } from "@/lib/language-context";
import { TrayResult, type TrayItem } from "@/lib/schemas";
import { TRAY_MENU, getTrayDish, type TrayDishId } from "@/lib/tray-menu";
import { CounterSessionView } from "./CounterSessionView";

/**
 * `/tray-tally` — Camera POS (real working feature).
 *
 * Phase machine:
 *   - 'capture' (default): live <WebcamCapture/> surface plus a known-menu
 *     reference card. Two capture sub-modes:
 *       • single — one tap = one /api/tray request → 'review' phase
 *       • auto   — capture every 10s, results accumulate into
 *                  `sessionTallies` with no UI interruption. Ending the
 *                  session navigates to 'session-summary'.
 *   - 'analyzing': spinner shown only for single-mode submissions.
 *   - 'review': editable list + add-dish picker + Record-sale button. Used
 *     for single-mode results.
 *   - 'session-summary': aggregate of every detection collected during an
 *     auto-mode session, grouped by dishId. Owner can record the whole
 *     session as one /api/tray-sale call or discard it.
 *   - 'sold': receipt screen, shared by both single and session flows.
 *
 * Honest design caveat (intentional, not a TODO): auto mode does NOT do
 * customer re-identification or unique-counting. Each captured frame's
 * detections accumulate naively into `sessionTallies`. If the same tray
 * is in frame for 30 seconds with three captures, that adds three lots
 * of the same items. The owner is expected to start auto mode when the
 * customer arrives and end it after they leave; framing it as a "session
 * tally" makes that contract explicit on screen.
 */
type Phase = "capture" | "analyzing" | "review" | "sold" | "session-summary" | "counter-active";

type CaptureMode = "single" | "auto" | "counter";

interface ReceiptLine {
  dishId: TrayDishId;
  name: string;
  quantity: number;
  pricePhp: number;
  subtotalPhp: number;
}

interface CompletedSale {
  lines: ReceiptLine[];
  totalPhp: number;
  recordedAt: Date;
}

interface SessionTally {
  dishId: TrayDishId;
  name: string;
  quantity: number;
  pricePhp: number;
  capturedAt: Date;
}

function computeTotal(items: TrayItem[]): number {
  const raw = items.reduce((sum, it) => {
    const dish = getTrayDish(it.dishId);
    return sum + dish.pricePhp * it.quantity;
  }, 0);
  return Number(raw.toFixed(2));
}

function computeSessionTotal(tallies: SessionTally[]): number {
  const raw = tallies.reduce((sum, t) => sum + t.pricePhp * t.quantity, 0);
  return Number(raw.toFixed(2));
}

interface SessionAggregate {
  dishId: TrayDishId;
  name: string;
  quantity: number;
  pricePhp: number;
  subtotalPhp: number;
}

/**
 * Group raw tallies by dishId so the summary view shows
 * "Adobo × 8 = ₱520" rather than 8 separate rows.
 */
function aggregateSession(tallies: SessionTally[]): SessionAggregate[] {
  const map = new Map<TrayDishId, SessionAggregate>();
  for (const t of tallies) {
    const existing = map.get(t.dishId);
    if (existing) {
      existing.quantity += t.quantity;
      existing.subtotalPhp = Number(
        (existing.pricePhp * existing.quantity).toFixed(2),
      );
    } else {
      map.set(t.dishId, {
        dishId: t.dishId,
        name: t.name,
        quantity: t.quantity,
        pricePhp: t.pricePhp,
        subtotalPhp: Number((t.pricePhp * t.quantity).toFixed(2)),
      });
    }
  }
  return Array.from(map.values());
}

export default function TrayTallyPage() {
  const t = useT();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("capture");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("single");
  const [items, setItems] = useState<TrayItem[]>([]);
  const [sessionTallies, setSessionTallies] = useState<SessionTally[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<CompletedSale | null>(null);

  const totalPhp = computeTotal(items);
  const sessionAggregate = aggregateSession(sessionTallies);
  const sessionTotal = computeSessionTotal(sessionTallies);

  const reset = () => {
    setPhase("capture");
    setCaptureMode("single");
    setItems([]);
    setSessionTallies([]);
    setLastSale(null);
    setSubmitting(false);
  };

  /**
   * Shared capture handler used by both single and auto modes. Called by
   * <WebcamCapture/> with a JPEG blob.
   *
   * Single mode: shows the analyzing spinner, advances to 'review' on
   * completion (success or empty).
   * Auto mode: silent — appends each detection to `sessionTallies` and
   * shows a brief confirmation toast. Errors are logged but do not break
   * the loop, otherwise a flaky network would kill the session.
   */
  const handleFrame = async (blob: Blob) => {
    const isAuto = captureMode === "auto";

    if (!isAuto) {
      setPhase("analyzing");
    }

    const fd = new FormData();
    fd.set("image", blob);

    try {
      const res = await fetch("/api/tray", { method: "POST", body: fd });

      if (!res.ok) {
        if (isAuto) {
          console.warn("[/tray-tally] auto-frame /api/tray non-OK", res.status);
          return;
        }
        toast.error(t("error_scan"));
        setItems([]);
        setPhase("review");
        return;
      }

      let parsedItems: TrayItem[] = [];
      try {
        const body = (await res.json()) as unknown;
        const parsed = TrayResult.safeParse(body);
        if (parsed.success) parsedItems = parsed.data.items;
      } catch {
        // Empty list fallback — owner can still recover via Add dish in
        // review phase, or the next auto cycle will retry.
      }

      if (isAuto) {
        if (parsedItems.length === 0) return; // silent no-op
        const now = new Date();
        const tallies: SessionTally[] = parsedItems.map((it) => {
          const dish = getTrayDish(it.dishId);
          return {
            dishId: it.dishId,
            name: dish.name,
            quantity: it.quantity,
            pricePhp: dish.pricePhp,
            capturedAt: now,
          };
        });
        setSessionTallies((prev) => [...prev, ...tallies]);
        const summary = parsedItems
          .map((it) => `${it.quantity}x ${getTrayDish(it.dishId).name}`)
          .join(", ");
        toast.success(`Detected: ${summary}`);
        return;
      }

      setItems(parsedItems);
      setPhase("review");
    } catch (err) {
      if (isAuto) {
        console.warn("[/tray-tally] auto-frame failed", err);
        return;
      }
      console.error("[/tray-tally] analyze failed", err);
      toast.error(t("error_scan"));
      setItems([]);
      setPhase("review");
    }
  };

  const setQuantity = (dishId: TrayDishId, nextQty: number) => {
    const safe = Math.max(1, Math.floor(nextQty));
    setItems((prev) =>
      prev.map((it) => (it.dishId === dishId ? { ...it, quantity: safe } : it)),
    );
  };

  const removeDish = (dishId: TrayDishId) => {
    setItems((prev) => prev.filter((it) => it.dishId !== dishId));
  };

  const addDish = (dishId: TrayDishId) => {
    setItems((prev) => {
      if (prev.some((it) => it.dishId === dishId)) return prev;
      return [...prev, { dishId, quantity: 1 }];
    });
  };

  /**
   * Guarded mode switch. Blocks switching away from 'counter' while a
   * counter session is active so the owner doesn't accidentally lose
   * detected sales mid-stream — they have to End or Discard explicitly.
   */
  const switchMode = (next: CaptureMode) => {
    if (phase === "counter-active" && next !== "counter") {
      toast.error(t("counter_end_first"));
      return;
    }
    if (captureMode === "auto" && next !== "auto" && sessionTallies.length > 0) {
      // Auto mode mid-session: advance to summary so tallies aren't lost.
      setPhase("session-summary");
    }
    setCaptureMode(next);
  };

  const endSession = () => {
    setCaptureMode("single");
    if (sessionTallies.length > 0) {
      setPhase("session-summary");
    }
  };

  const discardSession = () => {
    setSessionTallies([]);
    setPhase("capture");
    setCaptureMode("single");
  };

  /**
   * Records the active sale (either single-mode `items` or aggregated
   * `sessionTallies`) by POSTing to /api/tray-sale and transitioning to
   * the 'sold' receipt screen on success.
   */
  const recordSale = async (payloadItems: TrayItem[]) => {
    if (submitting || payloadItems.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tray-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });
      if (!res.ok) {
        toast.error(t("error_save"));
        return;
      }
      const body = (await res.json()) as {
        journalEntryId: string;
        totalPhp: number;
        lines: ReceiptLine[];
      };
      setLastSale({
        lines: body.lines,
        totalPhp: body.totalPhp,
        recordedAt: new Date(),
      });
      setPhase("sold");
      setItems([]);
      setSessionTallies([]);
      toast.success(t("order_success_toast"));
    } catch (err) {
      console.error("[/tray-tally] record sale failed", err);
      toast.error(t("error_save"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordSale = () => recordSale(items);

  const handleRecordSession = () => {
    const flat: TrayItem[] = sessionAggregate.map((a) => ({
      dishId: a.dishId,
      quantity: a.quantity,
    }));
    void recordSale(flat);
  };

  const dishesNotOnTray = TRAY_MENU.filter(
    (d) => !items.some((it) => it.dishId === d.id),
  );

  return (
    <>
      <AppHeader
        title={t("heading_tray_tally")}
        subtitle={t("heading_tray_tally_subtitle")}
      />
      <main className="flex flex-col gap-4 px-4 py-4 pb-32">
        {phase === "capture" ? (
          <>
            <section
              aria-label="Known menu"
              className="card flex flex-col gap-3"
            >
              <h2 className="text-sm font-semibold text-ink">
                {t("tray_known_menu")}
              </h2>
              <ul className="grid grid-cols-2 gap-2">
                {TRAY_MENU.map((d) => (
                  <li key={d.id} className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-xl">
                        {d.emoji}
                      </span>
                      <span className="text-ink">{d.name}</span>
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {formatPhp(d.pricePhp)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 3-pill mode segmented control. */}
            <div
              role="radiogroup"
              aria-label="Capture mode"
              className="grid grid-cols-3 gap-2"
            >
              <button
                type="button"
                role="radio"
                aria-checked={captureMode === "single"}
                onClick={() => switchMode("single")}
                className={`pill w-full justify-center !py-1.5 ${captureMode === "single" ? "pill-active" : ""}`}
              >
                {t("scan_mode_camera")}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={captureMode === "auto"}
                onClick={() => switchMode("auto")}
                className={`pill w-full justify-center !py-1.5 ${captureMode === "auto" ? "pill-active" : ""}`}
              >
                {t("tray_auto_mode_label")}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={captureMode === "counter"}
                onClick={() => switchMode("counter")}
                className={`pill w-full justify-center !py-1.5 ${captureMode === "counter" ? "pill-active" : ""}`}
              >
                {t("counter_mode_label")}
              </button>
            </div>

            {captureMode !== "counter" ? (
              <>
                <WebcamCapture
                  isAutoMode={captureMode === "auto"}
                  autoIntervalMs={10_000}
                  onCapture={handleFrame}
                  onError={(msg) => toast.error(msg)}
                />

                {captureMode === "auto" ? (
                  <div className="card flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-danger"
                      />
                      <span>{t("tray_auto_active")}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>
                        {sessionTallies.length} {t("tray_session_count")}
                      </span>
                      <span className="font-semibold text-ink">
                        {formatPhp(sessionTotal)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={endSession}
                      className="btn-secondary"
                    >
                      {t("tray_session_end")}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPhase("counter-active")}
                className="btn-primary"
              >
                {t("counter_start")}
              </button>
            )}
          </>
        ) : null}

        {phase === "counter-active" ? (
          <CounterSessionView
            recording={submitting}
            onRecord={(items) => {
              void recordSale(items);
            }}
            onDiscard={() => {
              setPhase("capture");
              setCaptureMode("counter");
            }}
          />
        ) : null}

        {phase === "analyzing" ? (
          <Spinner label={t("tray_phase_analyzing")} />
        ) : null}

        {phase === "review" ? (
          <>
            {items.length === 0 ? (
              <EmptyState
                title={t("tray_empty_title")}
                body={t("tray_empty_body")}
                cta={
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(234,88,12,0.35)] transition-opacity hover:opacity-90"
                  >
                    {t("retake")}
                  </button>
                }
              />
            ) : (
              <ul className="flex flex-col">
                {items.map((it) => {
                  const dish = getTrayDish(it.dishId);
                  const lineTotal = dish.pricePhp * it.quantity;
                  return (
                    <li
                      key={it.dishId}
                      className="card-flat flex items-center gap-3"
                    >
                      <span aria-hidden="true" className="text-2xl leading-none">
                        {dish.emoji}
                      </span>
                      <span className="flex-1 text-sm font-medium text-ink">
                        {dish.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQuantity(it.dishId, it.quantity - 1)}
                          aria-label={`Decrease ${dish.name} quantity`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-section text-ink hover:bg-border-strong"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm text-ink">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(it.dishId, it.quantity + 1)}
                          aria-label={`Increase ${dish.name} quantity`}
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
                        onClick={() => removeDish(it.dishId)}
                        aria-label={`Remove ${dish.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-section hover:text-danger"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {dishesNotOnTray.length > 0 ? (
              <section
                aria-label="Add dish picker"
                className="flex flex-col gap-2"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("tray_add_dish")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dishesNotOnTray.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => addDish(d.id)}
                      className="pill flex items-center gap-1 hover:border-primary hover:text-primary"
                    >
                      <span aria-hidden="true">{d.emoji}</span>
                      <span>{d.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {items.length > 0 ? (
              <div className="bottom-bar fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] flex-col gap-2 px-4 pb-6 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {t("tray_total")}
                  </span>
                  <span className="text-2xl font-bold text-ink">
                    {formatPhp(totalPhp)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRecordSale}
                  disabled={submitting || items.length === 0}
                  aria-busy={submitting}
                  className="btn-primary disabled:opacity-50"
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
                    t("tray_record_sale")
                  )}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {phase === "session-summary" ? (
          <>
            <section className="card flex flex-col gap-3">
              <header className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-ink">
                  {t("tray_session_summary")}
                </h2>
                <p className="text-xs text-muted">
                  {sessionTallies.length} {t("tray_session_count")}
                </p>
              </header>
              {sessionAggregate.length === 0 ? (
                <p className="text-sm text-muted">{t("tray_empty_title")}</p>
              ) : (
                <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
                  {sessionAggregate.map((a) => (
                    <li
                      key={a.dishId}
                      className="flex items-center justify-between text-sm text-ink"
                    >
                      <span>
                        {a.name} × {a.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPhp(a.subtotalPhp)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-ink">
                <span>{t("tray_session_total")}</span>
                <span>{formatPhp(sessionTotal)}</span>
              </div>
            </section>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRecordSession}
                disabled={submitting || sessionAggregate.length === 0}
                aria-busy={submitting}
                className="btn-primary disabled:opacity-50"
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
                  t("tray_record_sale")
                )}
              </button>
              <button
                type="button"
                onClick={discardSession}
                disabled={submitting}
                className="btn-secondary disabled:opacity-50"
              >
                {t("cta_dismiss")}
              </button>
            </div>
          </>
        ) : null}

        {phase === "sold" && lastSale ? (
          <>
            <section className="card flex flex-col gap-3">
              <header className="flex flex-col gap-2">
                <span className="inline-flex items-center self-start gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                  <span aria-hidden="true">✓</span>
                  <span>Paid</span>
                </span>
                <h2 className="text-base font-semibold text-ink">
                  {t("tray_receipt_heading")}
                </h2>
              </header>
              <p className="text-xs text-muted">
                {lastSale.recordedAt.toLocaleString()}
              </p>
              <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
                {lastSale.lines.map((l) => (
                  <li
                    key={l.dishId}
                    className="flex items-center justify-between text-sm text-ink"
                  >
                    <span>
                      {l.quantity} × {l.name}
                    </span>
                    <span className="font-medium">{formatPhp(l.subtotalPhp)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-ink">
                <span>{t("tray_total")}</span>
                <span>{formatPhp(lastSale.totalPhp)}</span>
              </div>
            </section>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={reset}
                className="btn-primary"
              >
                {t("tray_new_sale")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/finance")}
                className="btn-secondary"
              >
                {t("tray_view_finance")}
              </button>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
