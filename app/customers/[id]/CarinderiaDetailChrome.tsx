"use client";

import Link from "next/link";
import { useT } from "@/lib/language-context";
import { EmptyState } from "@/components/EmptyState";

/** Localized "← Back" link rendered above the carinderia detail. */
export function BackLink() {
  const t = useT();
  return (
    <Link
      href="/customers"
      className="text-sm text-muted px-4 pt-4 inline-block"
    >
      {t("back_link")}
    </Link>
  );
}

/** Localized "🚚 Coming soon: delivery" badge (Req 10.4). */
export function DeliveryBadge() {
  const t = useT();
  return (
    <div className="pill mx-4 mt-2">
      🚚 {t("coming_soon_delivery")}
    </div>
  );
}

/** Localized "Menu" section heading. */
export function MenuHeading() {
  const t = useT();
  return (
    <h2 className="text-base font-semibold text-ink px-4 pt-4 pb-2">
      {t("menu_heading")}
    </h2>
  );
}

/** Localized empty-state used when a carinderia has no menu items. */
export function EmptyMenu() {
  const t = useT();
  return (
    <EmptyState title={t("empty_menu_title")} body={t("empty_menu_body")} />
  );
}
