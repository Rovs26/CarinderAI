"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { WebcamCapture } from "@/components/WebcamCapture";
import { formatPhp } from "@/lib/currency";
import { useT } from "@/lib/language-context";
import { CounterFrame, type TrayItem } from "@/lib/schemas";
import { TRAY_MENU, getTrayDish, type TrayDishId } from "@/lib/tray-menu";

const FRAME_INTERVAL_MS = 8_000;
const CONFIRMATION_WINDOW = 3; // 3 consecutive frames of decrease confirms a sale
const MIN_END_DELAY_MS = 16_000; // Disable End for first 16s so baseline can settle
const NO_DISH_WARNING_THRESHOLD = 5; // 5 all-zero frames in a row → soft warning (once)

const DISH_IDS: readonly TrayDishId[] = TRAY_MENU.map((d) => d.id);

type CountsByDish = Record<TrayDishId, number>;

const ZERO_COUNTS: CountsByDish = {
  adobo: 0,
  sinigang: 0,
  "kare-kare": 0,
  pinakbet: 0,
  "lechon-kawali": 0,
  rice: 0,
};

function makeZero(): CountsByDish {
  return { ...ZERO_COUNTS };
}

function makePending(): Record<TrayDishId, number[]> {
  return {
    adobo: [],
    sinigang: [],
    "kare-kare": [],
    pinakbet: [],
    "lechon-kawali": [],
    rice: [],
  };
}

function summarizeNonZero(counts: CountsByDish): string {
  const parts: string[] = [];
  for (const id of DISH_IDS) {
    if (counts[id] > 0) {
      parts.push(`${getTrayDish(id).name} ${counts[id]}`);
    }
  }
  return parts.join(", ");
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function isAllZero(counts: CountsByDish): boolean {
  return DISH_IDS.every((id) => counts[id] === 0);
}

export interface CounterSessionViewProps {
  /** Called with the aggregated `recordedSales` payload when the owner taps Record. */
  onRecord: (items: TrayItem[]) => void;
  /** Called when the owner cancels (Discard) — parent should reset its phase. */
  onDiscard: () => void;
  /** True when a /api/tray-sale POST is in flight; disables Record button. */
  recording: boolean;
}

type Sub = "active" | "review";

/**
 * Counter Session — diff-based continuous sales tracker.
 *
 * Watches a webcam stream of the food counter via /api/tray/count every 8s.
 * The first observed frame becomes the baseline (silently — owner doesn't
 * see counts ticking up). Every subsequent frame is compared against the
 * previous frame:
 *   - decrease(dish) for 3 consecutive frames ⇒ confirmed sale equal to
 *     the sum of those decreases (then the pending window resets).
 *   - increase(dish) ⇒ probable refill; we do NOT auto-record. Instead we
 *     bump the baseline silently (preventing ghost sales when the owner
 *     restocks without tapping Refill) and toast a soft heads-up so they
 *     can confirm via the explicit Refill picker if they want.
 *
 * Honest framing: this watches the counter, not customers. The decrease
 * IS the sale. Refills, spillage, and demos with random hand-waving will
 * all corrupt the count — that's why Refill resets baseline per dish and
 * the owner can Discard the session before Recording.
 *
 * Frame timing: 8s interval. With GPT-4o vision latency ~1-2s, frames
 * may overlap if the model is slow; we guard against concurrent posts
 * with `inFlightRef` so only one request is outstanding at a time.
 */
export function CounterSessionView({
  onRecord,
  onDiscard,
  recording,
}: CounterSessionViewProps) {
  const t = useT();

  const [sub, setSub] = useState<Sub>("active");
  const [baseline, setBaseline] = useState<CountsByDish | null>(null);
  const [currentCounts, setCurrentCounts] = useState<CountsByDish>(makeZero);
  const [, setPendingDecreases] = useState(makePending);
  const [recordedSales, setRecordedSales] = useState<CountsByDish>(makeZero);
  const [activeDecreaseSet, setActiveDecreaseSet] = useState<Set<TrayDishId>>(
    () => new Set(),
  );
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [zeroStreak, setZeroStreak] = useState(0);
  const [warnedNoDishes, setWarnedNoDishes] = useState(false);
  const [showRefillPicker, setShowRefillPicker] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [startedAt] = useState<number>(() => Date.now());

  const inFlightRef = useRef(false);

  // Live ticking timer (drives mm:ss display + the End-disabled gate).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  /**
   * Process a single frame from /api/tray/count.
   *
   * On baseline frame: stash it, toast "Baseline set: {non-zero items}".
   * On subsequent frames: compute per-dish delta vs. the previous
   * `currentCounts`, slide the 3-frame confirmation window, and emit
   * confirmed sales when 3 consecutive decreases land.
   */
  const handleFrame = (counts: CountsByDish) => {
    setFramesAnalyzed((n) => n + 1);

    // Track all-zero streaks for the "check camera angle" soft warning.
    if (isAllZero(counts)) {
      setZeroStreak((s) => s + 1);
    } else {
      setZeroStreak(0);
    }

    if (baseline == null) {
      setBaseline(counts);
      setCurrentCounts(counts);
      const summary = summarizeNonZero(counts);
      toast.success(
        summary
          ? `${t("counter_baseline_set")}: ${summary}`
          : t("counter_baseline_set"),
      );
      return;
    }

    // Diff against previous observation, NOT baseline — we want a sale to
    // show up when the count drops, not when it has merely been low for a
    // while. Baseline is conceptually "what was on the counter before any
    // sale," but the rolling 3-frame check is over consecutive deltas.
    const previous = currentCounts;

    setPendingDecreases((prevPending) => {
      const next = { ...prevPending };
      const newActive = new Set<TrayDishId>();

      for (const id of DISH_IDS) {
        const delta = previous[id] - counts[id];

        if (delta > 0) {
          // Decrease — append to rolling window.
          const window = [...next[id], delta].slice(-CONFIRMATION_WINDOW);
          next[id] = window;
          if (
            window.length === CONFIRMATION_WINDOW &&
            window.every((v) => v >= 1)
          ) {
            const confirmed = window.reduce((s, v) => s + v, 0);
            // Confirmed sale — accumulate and clear the window.
            setRecordedSales((prevSales) => ({
              ...prevSales,
              [id]: prevSales[id] + confirmed,
            }));
            toast.success(
              `${t("counter_sale_detected")}: ${confirmed} ${getTrayDish(id).name}`,
            );
            next[id] = [];
          } else {
            newActive.add(id);
          }
        } else if (delta < 0) {
          // Increase — possible refill. Silently raise baseline so we
          // don't emit ghost sales next frame, and reset the pending
          // window for that dish. Soft toast tells the owner to confirm
          // with the Refill picker if needed.
          next[id] = [];
          setBaseline((bl) =>
            bl ? { ...bl, [id]: Math.max(bl[id], counts[id]) } : bl,
          );
          toast(`${t("counter_refill_detected")}: ${getTrayDish(id).name}`, {
            icon: "🔄",
          });
        } else {
          // No change — keep window as-is so a stable hand-wave doesn't
          // fold prior decreases. The window slides only when a new
          // decrease arrives, matching the spec.
        }
      }

      setActiveDecreaseSet(newActive);
      return next;
    });

    setCurrentCounts(counts);
  };

  // Soft warning when 5 frames in a row come back all-zero (camera at the
  // ceiling, lens cap on, etc.). Fires exactly once per session.
  useEffect(() => {
    if (zeroStreak >= NO_DISH_WARNING_THRESHOLD && !warnedNoDishes) {
      toast(t("counter_no_dishes_warning"), { icon: "⚠️" });
      setWarnedNoDishes(true);
    }
  }, [zeroStreak, warnedNoDishes, t]);

  /**
   * Frame capture callback handed to WebcamCapture. Wraps the raw blob in
   * FormData and POSTs to /api/tray/count. Errors are swallowed — the
   * loop must survive transient failures.
   */
  const onWebcamFrame = async (blob: Blob) => {
    if (inFlightRef.current) return; // skip overlapping frames
    inFlightRef.current = true;
    try {
      const fd = new FormData();
      fd.set("image", blob);
      const res = await fetch("/api/tray/count", { method: "POST", body: fd });
      if (!res.ok) {
        console.warn("[counter] /api/tray/count non-OK", res.status);
        return;
      }
      const body = (await res.json()) as unknown;
      const parsed = CounterFrame.safeParse(body);
      const counts = parsed.success ? parsed.data.counts : ZERO_COUNTS;
      handleFrame(counts);
    } catch (err) {
      console.warn("[counter] frame failed", err);
    } finally {
      inFlightRef.current = false;
    }
  };

  /** Refill picker action — resets baseline + pending window for one dish. */
  const handleRefill = (dishId: TrayDishId) => {
    setBaseline((bl) => (bl ? { ...bl, [dishId]: currentCounts[dishId] } : bl));
    setPendingDecreases((prev) => ({ ...prev, [dishId]: [] }));
    setActiveDecreaseSet((prev) => {
      const next = new Set(prev);
      next.delete(dishId);
      return next;
    });
    toast.success(`${t("counter_refill_done")} ${getTrayDish(dishId).name}.`);
    setShowRefillPicker(false);
  };

  const elapsedMs = now - startedAt;
  const canEnd = elapsedMs >= MIN_END_DELAY_MS;

  const handleEnd = () => {
    setSub("review");
  };

  // Aggregated sale payload (only dishes with >0 confirmed sales).
  const recordedItems = useMemo<TrayItem[]>(() => {
    return DISH_IDS.filter((id) => recordedSales[id] > 0).map((id) => ({
      dishId: id,
      quantity: recordedSales[id],
    }));
  }, [recordedSales]);

  const recordedTotal = useMemo(() => {
    let sum = 0;
    for (const id of DISH_IDS) {
      sum += getTrayDish(id).pricePhp * recordedSales[id];
    }
    return Number(sum.toFixed(2));
  }, [recordedSales]);

  if (sub === "review") {
    return (
      <CounterReviewCard
        recordedSales={recordedSales}
        recordedItems={recordedItems}
        recordedTotal={recordedTotal}
        framesAnalyzed={framesAnalyzed}
        elapsedMs={elapsedMs}
        recording={recording}
        onRecord={() => onRecord(recordedItems)}
        onDiscard={onDiscard}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <WebcamCapture
        onCapture={onWebcamFrame}
        onError={(msg) => toast.error(msg)}
        isAutoMode
        autoIntervalMs={FRAME_INTERVAL_MS}
        hideManualButton
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"
          />
          <span>{t("counter_active_indicator")}</span>
        </div>
        <span className="font-mono tabular-nums text-base font-medium text-ink">
          {formatDuration(elapsedMs)}
        </span>
      </div>

      <section aria-label="On counter now" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("counter_live_counts")}
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TRAY_MENU.map((d) => {
            const count = currentCounts[d.id];
            const pending = activeDecreaseSet.has(d.id);
            const isZero = count === 0 && baseline !== null;
            return (
              <span
                key={d.id}
                className={`pill flex shrink-0 items-center gap-1 ${
                  pending ? "ring-2 ring-yellow-400" : ""
                } ${isZero ? "opacity-40" : ""}`}
              >
                <span aria-hidden="true">{d.emoji}</span>
                <span>{d.name}</span>
                <span className="font-semibold tabular-nums">{count}</span>
              </span>
            );
          })}
        </div>
      </section>

      <section aria-label="Recorded sales" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("counter_recorded_so_far")}
          </h3>
          <span className="text-sm font-bold text-primary">
            {formatPhp(recordedTotal)}
          </span>
        </div>
        {recordedItems.length === 0 ? (
          <p className="text-xs text-muted">—</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recordedItems.map((it) => {
              const dish = getTrayDish(it.dishId);
              return (
                <span
                  key={it.dishId}
                  className="pill flex items-center gap-1"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.10)",
                    borderColor: "rgba(16, 185, 129, 0.30)",
                    color: "#047857",
                  }}
                >
                  <span aria-hidden="true">✓</span>
                  <span>{dish.name}</span>
                  <span className="font-semibold tabular-nums">× {it.quantity}</span>
                </span>
              );
            })}
          </div>
        )}
      </section>

      <div className="bottom-bar fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] flex-col gap-2 px-4 pb-6 pt-3">
        <button
          type="button"
          onClick={() => setShowRefillPicker(true)}
          className="btn-secondary"
        >
          {t("counter_refill")}
        </button>
        <button
          type="button"
          onClick={handleEnd}
          disabled={!canEnd}
          className="btn-primary disabled:opacity-50"
          title={canEnd ? undefined : `${t("loading")} (${formatDuration(MIN_END_DELAY_MS - elapsedMs)})`}
        >
          {t("counter_end")}
        </button>
      </div>

      {showRefillPicker ? (
        <RefillPicker
          currentCounts={currentCounts}
          onPick={handleRefill}
          onClose={() => setShowRefillPicker(false)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review card — phase 'counter-review'                                 */
/* ------------------------------------------------------------------ */

interface CounterReviewCardProps {
  recordedSales: CountsByDish;
  recordedItems: TrayItem[];
  recordedTotal: number;
  framesAnalyzed: number;
  elapsedMs: number;
  recording: boolean;
  onRecord: () => void;
  onDiscard: () => void;
}

function CounterReviewCard({
  recordedSales,
  recordedItems,
  recordedTotal,
  framesAnalyzed,
  elapsedMs,
  recording,
  onRecord,
  onDiscard,
}: CounterReviewCardProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-ink">
            {t("counter_session_summary")}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>
              {t("counter_session_duration")}:{" "}
              <span className="font-mono tabular-nums">
                {formatDuration(elapsedMs)}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {framesAnalyzed} {t("counter_session_frames")}
            </span>
          </div>
        </header>

        {recordedItems.length === 0 ? (
          <p className="text-sm text-muted">{t("tray_empty_title")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
            {recordedItems.map((it) => {
              const dish = getTrayDish(it.dishId);
              const subtotal = Number(
                (dish.pricePhp * recordedSales[it.dishId]).toFixed(2),
              );
              return (
                <li
                  key={it.dishId}
                  className="flex items-center justify-between text-sm text-ink"
                >
                  <span>
                    {it.quantity} × {dish.name}
                  </span>
                  <span className="font-medium">{formatPhp(subtotal)}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-ink">
          <span>{t("tray_total")}</span>
          <span>{formatPhp(recordedTotal)}</span>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onRecord}
          disabled={recording || recordedItems.length === 0}
          aria-busy={recording}
          className="btn-primary disabled:opacity-50"
        >
          {recording ? (
            <>
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <span className="ml-2">{t("loading")}</span>
            </>
          ) : (
            t("counter_record_sales")
          )}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={recording}
          className="btn-secondary disabled:opacity-50"
        >
          {t("counter_discard")}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Refill picker bottom sheet                                          */
/* ------------------------------------------------------------------ */

interface RefillPickerProps {
  currentCounts: CountsByDish;
  onPick: (dishId: TrayDishId) => void;
  onClose: () => void;
}

function RefillPicker({ currentCounts, onPick, onClose }: RefillPickerProps) {
  const t = useT();

  return (
    <>
      <button
        type="button"
        aria-label="Close refill picker"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("counter_refill_picker_title")}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-2xl bg-white border-t border-border pt-3 pb-3"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-border-strong mb-3" />
        <h2 className="px-4 pb-3 text-base font-semibold text-ink">
          {t("counter_refill_picker_title")}
        </h2>
        <div className="grid grid-cols-2 gap-2 px-4 pb-2">
          {TRAY_MENU.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onPick(d.id)}
              className="card-flat flex items-center gap-2 !py-3 hover:bg-section"
              style={{ borderRadius: "0.5rem", border: "1px solid var(--color-border)" }}
            >
              <span aria-hidden="true" className="text-xl">
                {d.emoji}
              </span>
              <div className="flex flex-1 flex-col items-start">
                <span className="text-sm font-medium text-ink">{d.name}</span>
                <span className="text-xs text-muted">
                  Now: {currentCounts[d.id]}
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            {t("journal_cancel")}
          </button>
        </div>
      </div>
    </>
  );
}
