"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useCart } from "@/lib/cart-store";
import { formatPhp } from "@/lib/currency";
import { AppHeader } from "@/components/AppHeader";
import { CartLine } from "@/components/CartLine";
import { EmptyState } from "@/components/EmptyState";
import { useT } from "@/lib/language-context";

/**
 * `/market/cart` — Tier 1 cart and checkout (Req 3.3, 3.4, 3.8, 3.9, 3.10,
 * 17.1, 17.3, 17.4).
 *
 * Client component because it reads the Zustand cart store and posts to
 * `/api/orders`. Matched lines feed the total; unmatched lines (carried
 * over from the Scan flow) render in a separate group and are excluded
 * from the total per Req 8.3.
 *
 * All user-facing copy is routed through `useT()` and localized via
 * `STRINGS` (see `lib/strings.ts`). The Tagalog values for keys like
 * `empty_cart` and `cta_checkout` are the verbatim Req 21 strings.
 */
export default function CartPage() {
  const t = useT();
  const lines = useCart((s) => s.lines);
  const unmatched = useCart((s) => s.unmatched);
  const totalPhpFn = useCart((s) => s.totalPhp);
  const clear = useCart((s) => s.clear);

  const [submitting, setSubmitting] = useState(false);

  // Zustand `persist` hydrates after the first client render. Render a
  // neutral skeleton until then so users with persisted carts don't see
  // a brief empty-state flash.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const total = totalPhpFn();
  const isEmpty = lines.length === 0 && unmatched.length === 0;
  const checkoutDisabled = lines.length === 0 || submitting;

  const handleCheckout = async () => {
    if (checkoutDisabled) return;
    setSubmitting(true);
    try {
      const payload = {
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t("order_success_toast"));
        clear();
        return;
      }

      let message = t("error_checkout");
      try {
        const data = (await res.json()) as { error?: string };
        if (data && typeof data.error === "string" && data.error.length > 0) {
          message = data.error;
        }
      } catch {
        // ignore parse failure; fall back to generic message
      }
      toast.error(message);
    } catch (err) {
      console.error("[/market/cart] checkout failed", err);
      toast.error(t("error_checkout"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col pb-32">
      <AppHeader title={t("heading_cart")} subtitle={t("subtitle_cart")} />

      {!mounted ? (
        <div className="px-4 py-12 text-center text-sm text-muted">
          {t("loading")}
        </div>
      ) : isEmpty ? (
        <EmptyState title={t("empty_cart_title")} body={t("empty_cart")} />
      ) : (
        <>
          {lines.length > 0 ? (
            <section aria-label="Cart lines" className="flex flex-col">
              {lines.map((line) => (
                <CartLine key={line.productId} line={line} />
              ))}
            </section>
          ) : null}

          {unmatched.length > 0 ? (
            <section aria-label="Unmatched lines" className="mt-6 px-4">
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-ink">
                  {t("unmatched_group_title")}
                </h2>
                <p className="text-xs text-muted">
                  {t("unmatched_group_body")}
                </p>
              </div>
              <ul className="flex flex-col">
                {unmatched.map((u, idx) => (
                  <li
                    key={`${u.name}-${idx}`}
                    className="card-flat flex items-center gap-3"
                  >
                    <span className="text-2xl leading-none" aria-hidden="true">
                      ❓
                    </span>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-ink">
                        {u.name}
                      </span>
                      {u.note ? (
                        <span className="text-xs text-muted">{u.note}</span>
                      ) : null}
                    </div>
                    <span className="text-sm text-muted">
                      {u.quantity} {u.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {mounted && !isEmpty ? (
        <div className="bottom-bar fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-4 pb-6 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted">{t("cart_total_label")}</span>
            <span className="text-lg font-bold text-ink">
              {formatPhp(total)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutDisabled}
            aria-busy={submitting}
            className="btn-primary disabled:opacity-50"
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
              t("cta_checkout")
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
