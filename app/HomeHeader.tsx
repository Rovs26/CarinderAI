"use client";

import { AppHeader } from "@/components/AppHeader";
import { useT } from "@/lib/language-context";

/**
 * Header row for `/` (Dashboard). Rendered as a client island so the
 * heading and subtitle follow the active language toggle via `useT()`.
 * The parent RSC owns all data fetching; this component renders chrome only.
 */
export function HomeHeader() {
  const t = useT();
  return (
    <AppHeader
      title={t("heading_dashboard")}
      subtitle={t("subtitle_dashboard")}
    />
  );
}
