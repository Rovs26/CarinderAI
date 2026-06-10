"use client";

// app/settings/page.tsx
// Settings_Module — language toggle (Reqs 13.1, 13.2; Design §Routing Map).
//
// Renders a single full-width tap row that toggles the active language
// between 'en' and 'tl'. Tapping the row calls `setLang`, which updates
// `LanguageContext`; visible text across the app re-renders because every
// consumer reads through `useT`. The row sits between two `.section-band`
// dividers (8px FB-gray bands) per the flat white design system. The page
// heading uses `useT('heading_settings')`; the small note below the row
// renders directly via `lang === 'tl' ? ...` (no dedicated key — polish
// task 15.11 audits surfaces still hardcoding strings).

import { AppHeader } from "@/components/AppHeader";
import { useT, useLang } from "@/lib/language-context";

export default function SettingsPage() {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <>
      <AppHeader
        title={t("heading_settings")}
        subtitle={lang === "tl" ? "Wika" : "Language"}
      />
      <main className="flex flex-col">
        <div className="section-band" />

        <button
          type="button"
          onClick={() => setLang(lang === "tl" ? "en" : "tl")}
          aria-label="Toggle language"
          className="tap-row justify-between"
        >
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium text-ink">
              {lang === "tl" ? "Wika" : "Language"}
            </span>
            <span className="text-xs text-muted">
              {lang === "tl" ? "Tagalog" : "English"}
            </span>
          </div>
          <span aria-hidden="true" className="text-muted">›</span>
        </button>

        <div className="section-band" />

        <p className="px-4 py-3 text-xs text-muted">
          {lang === "tl"
            ? "I-tap para ipalit. I-reload para makita ang lahat ng pagbabago."
            : "Tap to toggle. Reload to see all changes."}
        </p>
      </main>
    </>
  );
}
