"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useT } from "@/lib/language-context";
import type { StringKey } from "@/lib/strings";

export interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

interface MoreEntry {
  href: string;
  icon: string;
  labelKey: StringKey;
  pillKey?: StringKey;
}

const ENTRIES: MoreEntry[] = [
  { href: "/customers", icon: "🍴", labelKey: "heading_customers" },
  { href: "/insights", icon: "🔮", labelKey: "heading_insights" },
  {
    href: "/tray-tally",
    icon: "🍱",
    labelKey: "heading_tray_tally",
    pillKey: "pill_beta",
  },
  { href: "/settings", icon: "⚙️", labelKey: "heading_settings" },
];

/**
 * Bottom sheet shown when the user taps the "More" tab in `BottomNav`.
 *
 * Visibility is controlled entirely by the parent (no `/more` route): when
 * `open` is false the component renders nothing. When `open`, a backdrop and
 * a bottom-anchored sheet are rendered. Tapping the backdrop, pressing ESC,
 * or tapping any link calls `onClose()` so the sheet always collapses on
 * navigation.
 *
 * Labels are routed through `useT()` and resolve from `lib/strings.ts`, so
 * the sheet honors the active language toggle.
 */
export function MoreSheet({ open, onClose }: MoreSheetProps) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("tab_more")}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-2xl bg-white pt-3 pb-3 border-t border-border"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-border-strong mb-3" />
        <nav>
          <ul>
            {ENTRIES.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  onClick={onClose}
                  className="tap-row hover:bg-section"
                >
                  <span aria-hidden="true" className="text-xl">
                    {entry.icon}
                  </span>
                  <span className="flex-1 text-ink">{t(entry.labelKey)}</span>
                  {entry.pillKey ? (
                    <span className="pill pill-active">
                      {t(entry.pillKey)}
                    </span>
                  ) : null}
                  <span aria-hidden="true" className="text-muted">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            {/* Hardcoded label intentional — MoreSheet has no t() in scope today; future polish can route through useT */}
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
