"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { ASSETS, resolveSampleOrderPath } from "@/lib/assets";
import { validateImageFile } from "@/lib/image-validation";
import {
  orderDraftSummary,
  sampleExtractedOrder,
  sampleExtractedText,
  type OrderLineItem,
} from "@/lib/mock-data";
import { getSelectedSupplier, type StoredSupplier } from "@/lib/supplier-session";

const STEPS = ["Upload", "Preview", "Extract", "Confirm"];

const FALLBACK_RATE_LIMIT =
  "Too many extraction attempts. Demo order loaded so you can continue.";

const FALLBACK_UNAVAILABLE =
  "AI extraction is unavailable right now. Demo order loaded so you can continue.";

const DRAFT_PREPARED_MESSAGE =
  "Draft is ready. In V3, this will send to the selected supplier.";

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

function newBlankItem(): OrderLineItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    item: "",
    quantity: 1,
    unit: "pcs",
    notes: "",
  };
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
  onRemove,
  canRemove,
}: {
  row: OrderLineItem;
  updateItem: (id: string, field: keyof OrderLineItem, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--color-muted)]">Line item</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-red-600"
          >
            Remove
          </button>
        )}
      </div>
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
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [isDemoOrder, setIsDemoOrder] = useState(false);
  const [isSamplePhoto, setIsSamplePhoto] = useState(false);
  const [sampleImagePath, setSampleImagePath] = useState<string | null>(null);
  const [samplePhotoError, setSamplePhotoError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<StoredSupplier | null>(null);
  const [draftPrepared, setDraftPrepared] = useState(false);

  useEffect(() => {
    setSelectedSupplier(getSelectedSupplier());
  }, []);

  const supplierLabel =
    selectedSupplier?.name ?? `Suggested: ${orderDraftSummary.suggestedSupplier}`;

  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const applyExtraction = useCallback(
    (raw: string, lineItems: OrderLineItem[], opts?: { demo?: boolean }) => {
      setRawText(raw);
      setItems(lineItems);
      setExtracted(true);
      setStep(3);
      setIsDemoOrder(!!opts?.demo);
      setDraftPrepared(false);
    },
    []
  );

  const loadDemoOrder = useCallback(() => {
    clearPreviewUrl(previewUrl);
    setPreviewUrl(null);
    setImageFile(null);
    setIsSamplePhoto(false);
    setSampleImagePath(null);
    setSamplePhotoError(null);
    setFileError(null);
    setLoading(false);
    setConfirmed(false);
    setFallbackNotice(null);
    setApiWarnings([]);
    setConfidence(null);
    const mock = applyMockExtraction();
    applyExtraction(mock.rawText, mock.items, { demo: true });
  }, [applyExtraction, clearPreviewUrl, previewUrl]);

  const useSamplePhoto = useCallback(async () => {
    clearPreviewUrl(previewUrl);
    setExtracted(false);
    setLoading(false);
    setFallbackNotice(null);
    setFileError(null);
    setApiWarnings([]);
    setConfidence(null);
    setIsDemoOrder(false);
    setConfirmed(false);
    setRawText("");
    setItems([]);
    setSamplePhotoError(null);

    const path = await resolveSampleOrderPath();
    if (!path) {
      setSamplePhotoError("Sample photo not found. Use demo order or upload your own.");
      setIsSamplePhoto(false);
      return;
    }

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("Sample not found");
      const blob = await res.blob();
      const ext = path.endsWith(".png") ? "png" : "jpg";
      const file = new File([blob], `sample-handwritten-order.${ext}`, {
        type: blob.type || (ext === "png" ? "image/png" : "image/jpeg"),
      });
      const validationError = validateImageFile(file);
      if (validationError) {
        setFileError(validationError);
        return;
      }
      setImageFile(file);
      setSampleImagePath(path);
      setPreviewUrl(path);
      setIsSamplePhoto(true);
      setStep(1);
    } catch {
      setSamplePhotoError("Could not load sample photo. Try demo order instead.");
      setIsSamplePhoto(false);
      setImageFile(null);
      setPreviewUrl(null);
      setSampleImagePath(null);
    }
  }, [clearPreviewUrl, previewUrl]);

  const handleCameraCapture = useCallback(
    (file: File, url: string) => {
      clearPreviewUrl(previewUrl);
      setPreviewUrl(url);
      setImageFile(file);
      setIsSamplePhoto(false);
      setSampleImagePath(null);
      setSamplePhotoError(null);
      setFileError(validateImageFile(file));
      setIsDemoOrder(false);
      setStep(1);
      setExtracted(false);
      setLoading(false);
      setFallbackNotice(null);
      setApiWarnings([]);
      setConfidence(null);
      setConfirmed(false);
      setRawText("");
      setItems([]);
    },
    [clearPreviewUrl, previewUrl]
  );

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      clearPreviewUrl(previewUrl);
      const validationError = validateImageFile(file);
      setFileError(validationError);
      if (validationError) {
        e.target.value = "";
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageFile(file);
      setIsSamplePhoto(false);
      setSampleImagePath(null);
      setSamplePhotoError(null);
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
    },
    [clearPreviewUrl, previewUrl]
  );

  const loadMockFallback = useCallback(
    (message: string) => {
      const mock = applyMockExtraction();
      applyExtraction(mock.rawText, mock.items);
      setFallbackNotice(message);
    },
    [applyExtraction]
  );

  const extractOrder = async () => {
    if (!imageFile) return;

    const validationError = validateImageFile(imageFile);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    setLoading(true);
    setFallbackNotice(null);
    setFileError(null);
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

      if (response.status === 429) {
        loadMockFallback(FALLBACK_RATE_LIMIT);
        return;
      }

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
        loadMockFallback(FALLBACK_UNAVAILABLE);
      }
    } catch {
      loadMockFallback(FALLBACK_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (id: string, field: keyof OrderLineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, newBlankItem()]);
    setDraftPrepared(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id));
    setDraftPrepared(false);
  };

  const reset = () => {
    clearPreviewUrl(previewUrl);
    setPreviewUrl(null);
    setImageFile(null);
    setIsSamplePhoto(false);
    setSampleImagePath(null);
    setSamplePhotoError(null);
    setFileError(null);
    setStep(0);
    setExtracted(false);
    setLoading(false);
    setFallbackNotice(null);
    setApiWarnings([]);
    setConfidence(null);
    setIsDemoOrder(false);
    setConfirmed(false);
    setDraftPrepared(false);
    setRawText("");
    setItems([]);
  };

  const bottomBarVisible = extracted && !loading && !confirmed;

  return (
    <div className={`space-y-5 ${bottomBarVisible ? "pb-36" : "pb-8"}`}>
      <p className="card-warm card text-sm leading-relaxed text-stone-800">
        Write your supplier list on paper, take a photo, and CarinderAI turns it into an
        editable order.
      </p>

      {selectedSupplier && (
        <p className="rounded-xl border border-orange-200/80 bg-orange-50/90 px-4 py-2.5 text-sm text-stone-800">
          <span className="font-semibold text-[var(--color-accent)]">Supplier selected:</span>{" "}
          {selectedSupplier.name}
        </p>
      )}

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

      {!extracted && (
        <section className="card">
          <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">Step 1</p>
          <h3 className="mt-1 font-semibold">Take or upload photo</h3>
          <div className="mt-4 space-y-3">
            <CameraCapture onCapture={handleCameraCapture} disabled={loading} />
            <label className="upload-zone relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl px-4 py-5">
              {!previewUrl && (
                <div className="pointer-events-none mb-2 h-16 w-16">
                  <Image
                    src={ASSETS.captureEmptyState}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain opacity-85"
                  />
                </div>
              )}
              <span className="text-sm font-semibold">Upload from gallery</span>
              <span className="mt-0.5 text-xs text-[var(--color-muted)]">JPG, PNG · max 5MB</span>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={onFile}
                aria-label="Upload supplier order photo"
              />
            </label>
            {fileError && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {fileError}
              </p>
            )}
            {samplePhotoError && (
              <p className="text-xs text-amber-800">{samplePhotoError}</p>
            )}
            <button
              type="button"
              onClick={useSamplePhoto}
              disabled={loading}
              className="btn-secondary text-sm !py-3"
            >
              Use sample photo
            </button>
            <button type="button" onClick={loadDemoOrder} disabled={loading} className="btn-ghost">
              Use demo order
            </button>
          </div>
        </section>
      )}

      {previewUrl && !isDemoOrder && (
        <section className="card">
          <p className="text-xs font-semibold uppercase text-[var(--color-accent)]">Step 2</p>
          <h3 className="mt-1 font-semibold">
            Preview{isSamplePhoto ? " (sample photo)" : ""}
          </h3>
          <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            {isSamplePhoto && sampleImagePath ? (
              <Image
                src={sampleImagePath}
                alt="Sample handwritten supplier order list on paper"
                fill
                className="object-contain"
                sizes="(max-width: 480px) 100vw, 480px"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Your handwritten supplier order list"
                className="h-full w-full object-contain"
              />
            )}
          </div>
          {!extracted && (
            <>
              {fileError && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {fileError}
                </p>
              )}
              <button
                type="button"
                onClick={extractOrder}
                disabled={loading || !imageFile || !!fileError}
                className="btn-primary mt-4 disabled:opacity-60"
              >
                {loading ? "Reading handwritten order..." : "Extract order"}
              </button>
            </>
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

          <div className="mt-6 flex items-center justify-between gap-2">
            <h3 className="font-semibold">Edit items</h3>
            <button type="button" onClick={addItem} className="text-sm font-semibold text-[var(--color-accent)]">
              + Add item
            </button>
          </div>

          <ul className="mt-3 space-y-3">
            {items.map((row) => (
              <li
                key={row.id}
                className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3"
              >
                <OrderItemFields
                  row={row}
                  updateItem={updateItem}
                  onRemove={() => removeItem(row.id)}
                  canRemove={items.length > 1}
                />
              </li>
            ))}
          </ul>

          {items.length === 0 && (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              No items yet. Add at least one line for your supplier draft.
            </p>
          )}

          <button
            type="button"
            onClick={() => setDraftPrepared(true)}
            className="btn-secondary mt-4 text-sm !py-3"
          >
            Prepare supplier draft
          </button>
          {draftPrepared && (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-sm text-emerald-900">
              {DRAFT_PREPARED_MESSAGE}
            </p>
          )}

          <button type="button" onClick={reset} className="btn-ghost mt-3 text-sm">
            Reset workflow
          </button>
        </section>
      )}

      {bottomBarVisible && (
        <div className="glass-nav fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 py-3">
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            disabled={items.length === 0}
            className="btn-primary disabled:opacity-60"
          >
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
              <span>Estimate</span>
              <strong className="text-right text-xs font-semibold leading-snug">
                Estimate pending supplier confirmation
              </strong>
            </li>
            <li className="flex justify-between gap-2">
              <span>{selectedSupplier ? "Supplier" : "Suggested supplier"}</span>
              <strong className="text-right">{supplierLabel}</strong>
            </li>
          </ul>
          <p className="mt-4 rounded-lg bg-white/60 px-3 py-2 text-sm text-emerald-800">
            <strong>Next step:</strong> Review with supplier before sending.
          </p>
          <button type="button" onClick={reset} className="btn-secondary mt-4">
            Start new order
          </button>
        </section>
      )}
    </div>
  );
}
