"use client";

import { useCallback, useState } from "react";
import {
  orderDraftSummary,
  sampleExtractedOrder,
  sampleExtractedText,
  type OrderLineItem,
} from "@/lib/mock-data";
import { formatPeso } from "@/lib/utils";

const STEPS = ["Upload", "Preview", "Extract", "Confirm"];

const FALLBACK_MESSAGE =
  "AI extraction is unavailable right now, so we loaded a demo order you can still test.";

type ApiItem = {
  item: string;
  quantity: number;
  unit: string;
  notes: string;
};

type ApiSuccess = {
  extractedText: string;
  items: ApiItem[];
  confidence?: "high" | "medium" | "low";
  warnings?: string[];
};

function applyMockExtraction(): { rawText: string; items: OrderLineItem[] } {
  return {
    rawText: sampleExtractedText,
    items: sampleExtractedOrder.map((i) => ({ ...i })),
  };
}

function mapApiItems(items: ApiItem[]): OrderLineItem[] {
  return items.map((row, index) => ({
    id: String(index + 1),
    item: row.item,
    quantity: row.quantity,
    unit: row.unit,
    notes: row.notes ?? "",
  }));
}

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-emerald-50 text-emerald-800 border-emerald-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    low: "bg-stone-100 text-stone-700 border-stone-200",
  };
  const labels = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[level]}`}
    >
      {labels[level]}
    </span>
  );
}

function OrderItemFields({
  row,
  updateItem,
}: {
  row: OrderLineItem;
  updateItem: (id: string, field: keyof OrderLineItem, value: string | number) => void;
}) {
  return (
    <>
      <label className="block">
        <span className="text-xs text-[var(--color-muted)]">Item</span>
        <input
          className="input-touch mt-1 !py-2.5 text-sm"
          value={row.item}
          onChange={(e) => updateItem(row.id, "item", e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-[var(--color-muted)]">Qty</span>
          <input
            type="number"
            inputMode="numeric"
            className="input-touch mt-1 !py-2.5 text-sm"
            value={row.quantity}
            onChange={(e) =>
              updateItem(row.id, "quantity", Number(e.target.value) || 0)
            }
          />
        </label>
        <label className="block">
          <span className="text-xs text-[var(--color-muted)]">Unit</span>
          <input
            className="input-touch mt-1 !py-2.5 text-sm"
            value={row.unit}
            onChange={(e) => updateItem(row.id, "unit", e.target.value)}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-[var(--color-muted)]">Notes</span>
        <input
          className="input-touch mt-1 !py-2.5 text-sm"
          value={row.notes}
          onChange={(e) => updateItem(row.id, "notes", e.target.value)}
        />
      </label>
    </>
  );
}

export function CaptureOrderWorkflow() {
  const [step, setStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [isDemoOrder, setIsDemoOrder] = useState(false);
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const applyExtraction = useCallback(
    (raw: string, lineItems: OrderLineItem[], opts?: { demo?: boolean }) => {
      setRawText(raw);
      setItems(lineItems);
      setExtracted(true);
      setStep(3);
      setIsDemoOrder(!!opts?.demo);
    },
    []
  );

  const loadDemoOrder = useCallback(() => {
    setLoading(false);
    setConfirmed(false);
    setFallbackNotice(null);
    setApiWarnings([]);
    setConfidence(null);
    const mock = applyMockExtraction();
    applyExtraction(mock.rawText, mock.items, { demo: true });
  }, [applyExtraction]);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setImageFile(file);
    setStep(1);
    setExtracted(false);
    setLoading(false);
    setFallbackNotice(null);
    setApiWarnings([]);
    setConfidence(null);
    setIsDemoOrder(false);
    setConfirmed(false);
    setRawText("");
    setItems([]);
    e.target.value = "";
  }, []);

  const extractOrder = async () => {
    if (!imageFile) return;

    setLoading(true);
    setFallbackNotice(null);
    setApiWarnings([]);
    setConfidence(null);
    setIsDemoOrder(false);
    setConfirmed(false);
    setStep(2);

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch("/api/extract-order", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ApiSuccess & {
        error?: string;
        fallbackAvailable?: boolean;
      };

      if (response.ok && data.items?.length) {
        applyExtraction(data.extractedText, mapApiItems(data.items));
        if (
          data.confidence === "high" ||
          data.confidence === "medium" ||
          data.confidence === "low"
        ) {
          setConfidence(data.confidence);
        }
        setApiWarnings(data.warnings?.filter(Boolean) ?? []);
      } else {
        throw new Error(data.error ?? "Extraction failed");
      }
    } catch {
      const mock = applyMockExtraction();
      applyExtraction(mock.rawText, mock.items);
      setFallbackNotice(FALLBACK_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (id: string, field: keyof OrderLineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageFile(null);
    setStep(0);
    setExtracted(false);
    setLoading(false);
    setFallbackNotice(null);
    setApiWarnings([]);
    setConfidence(null);
    setIsDemoOrder(false);
    setConfirmed(false);
    setRawText("");
    setItems([]);
  };

  return (
    <div className="space-y-5 pb-8">
      <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm leading-relaxed text-stone-800">
        Write your supplier list on paper, take a photo, and CarinderAI turns it into an
        editable order.
      </p>

      <ol className="flex gap-1">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg py-2 text-center text-[10px] font-semibold uppercase tracking-wide ${
              i <= step
                ? "bg-[var(--color-accent)] text-white"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      <section className="card">
        <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">Step 1</p>
        <h3 className="mt-1 font-semibold">Take or upload photo</h3>
        <label className="mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 px-4 py-8 active:bg-orange-50">
          <span className="text-3xl" aria-hidden>
            ◉
          </span>
          <span className="mt-2 text-base font-semibold">Tap for camera or gallery</span>
          <span className="mt-1 text-xs text-[var(--color-muted)]">JPG, PNG · max 5MB</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onFile}
          />
        </label>
        {!extracted && (
          <button
            type="button"
            onClick={loadDemoOrder}
            disabled={loading}
            className="mt-3 w-full rounded-xl border border-dashed border-stone-300 py-3 text-sm font-medium text-[var(--color-muted)] active:bg-stone-50"
          >
            Use demo order
          </button>
        )}
      </section>

      {previewUrl && !isDemoOrder && (
        <section className="card">
          <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">Step 2</p>
          <h3 className="mt-1 font-semibold">Preview</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Handwritten order list"
            className="mt-3 max-h-64 w-full rounded-xl border border-stone-200 object-contain bg-stone-50"
          />
          {!extracted && (
            <button
              type="button"
              onClick={extractOrder}
              disabled={loading || !imageFile}
              className="btn-primary mt-4 disabled:opacity-60"
            >
              {loading ? "Reading handwritten order..." : "Extract order"}
            </button>
          )}
        </section>
      )}

      {loading && (
        <p className="text-center text-sm font-medium text-[var(--color-accent)]">
          Reading handwritten order...
        </p>
      )}

      {fallbackNotice && extracted && !loading && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {fallbackNotice}
        </p>
      )}

      {isDemoOrder && extracted && !loading && !fallbackNotice && (
        <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          Demo order loaded — edit items and confirm to show the full flow.
        </p>
      )}

      {extracted && !loading && (
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">
              Step 3
            </p>
            {confidence && <ConfidenceBadge level={confidence} />}
          </div>
          <h3 className="mt-1 font-semibold">Review extracted order</h3>
          <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm italic text-stone-700">
            &ldquo;{rawText}&rdquo;
          </p>

          {apiWarnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
              {apiWarnings.map((w) => (
                <li key={w} className="flex gap-2">
                  <span aria-hidden>!</span>
                  {w}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-6 font-semibold">Edit items</h3>

          <ul className="mt-3 space-y-3 md:hidden">
            {items.map((row) => (
              <li
                key={row.id}
                className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3"
              >
                <OrderItemFields row={row} updateItem={updateItem} />
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-[var(--color-muted)]">
                  <th className="pb-2 pr-2 font-medium">Item</th>
                  <th className="pb-2 pr-2 font-medium">Qty</th>
                  <th className="pb-2 pr-2 font-medium">Unit</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100">
                    <td className="py-2 pr-2">
                      <input
                        className="w-full rounded-lg border border-stone-200 px-2 py-2"
                        value={row.item}
                        onChange={(e) => updateItem(row.id, "item", e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        className="w-20 rounded-lg border border-stone-200 px-2 py-2"
                        value={row.quantity}
                        onChange={(e) =>
                          updateItem(row.id, "quantity", Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="w-24 rounded-lg border border-stone-200 px-2 py-2"
                        value={row.unit}
                        onChange={(e) => updateItem(row.id, "unit", e.target.value)}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        className="w-full rounded-lg border border-stone-200 px-2 py-2"
                        value={row.notes}
                        onChange={(e) => updateItem(row.id, "notes", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 hidden gap-2 md:flex">
            <button type="button" onClick={reset} className="btn-secondary !w-auto flex-1">
              Reset
            </button>
            <button type="button" disabled className="btn-secondary !w-auto flex-1 opacity-50">
              Send to supplier
            </button>
          </div>
        </section>
      )}

      {extracted && !loading && !confirmed && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
          <button type="button" onClick={() => setConfirmed(true)} className="btn-primary">
            Confirm order
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-2 w-full py-2 text-center text-sm font-medium text-[var(--color-muted)]"
          >
            Reset
          </button>
        </div>
      )}

      {extracted && !loading && !confirmed && (
        <div className="hidden md:block">
          <button type="button" onClick={() => setConfirmed(true)} className="btn-primary">
            Confirm order
          </button>
        </div>
      )}

      {confirmed && (
        <section className="card border-emerald-200 bg-emerald-50">
          <p className="text-xs font-semibold uppercase text-emerald-700">Step 4 · Complete</p>
          <h3 className="mt-1 text-lg font-semibold text-emerald-900">
            Order draft ready for supplier review
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-emerald-900">
            <li className="flex justify-between gap-2 border-b border-emerald-200/60 pb-2">
              <span>Line items</span>
              <strong>{items.length}</strong>
            </li>
            <li className="flex justify-between gap-2 border-b border-emerald-200/60 pb-2">
              <span>Estimated total</span>
              <strong>{formatPeso(orderDraftSummary.estimatedTotalCost)}</strong>
            </li>
            <li className="flex justify-between gap-2">
              <span>Suggested supplier</span>
              <strong className="text-right">{orderDraftSummary.suggestedSupplier}</strong>
            </li>
          </ul>
          <p className="mt-4 rounded-lg bg-white/60 px-3 py-2 text-sm text-emerald-800">
            <strong>Next step:</strong> Share this draft with your supplier for pricing and
            delivery confirmation.
          </p>
          <button type="button" onClick={reset} className="btn-secondary mt-4">
            Start new order
          </button>
        </section>
      )}
    </div>
  );
}
