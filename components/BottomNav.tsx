"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreSheet } from "./MoreSheet";
import { useT } from "@/lib/language-context";
import type { StringKey } from "@/lib/strings";

interface TabItem {
  key: string;
  href: string;
  icon: string;
  labelKey: StringKey;
}

const LEFT_TABS: TabItem[] = [
  { key: "home", href: "/", icon: "🏠", labelKey: "tab_home" },
  { key: "market", href: "/market", icon: "🛒", labelKey: "tab_market" },
];

const RIGHT_TABS: TabItem[] = [
  { key: "finance", href: "/finance", icon: "💼", labelKey: "tab_finance" },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

const tabBase =
  "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs";

/**
 * Bottom tab bar shown inside `PhoneFrame` on every screen.
 *
 * Layout: a 5-cell flex row (Home, Market, Scan, Finance, More). The center
 * cell is a non-interactive spacer; the raised circular Scan button is an
 * absolutely-positioned `<Link>` overlaid on that cell.
 *
 * Tab labels are routed through `useT()` and resolve from `lib/strings.ts`,
 * so the nav honors the active language toggle. The Scan button itself is
 * icon-only with an `aria-label` taken from the localized `tab_scan` key.
 *
 * The "More" tab is a button (not a Link); it toggles `MoreSheet` visibility
 * via local `useState`. There is no `/more` route per the design.
 */
export function BottomNav() {
  const t = useT();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className="bottom-bar fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[480px]"
      >
        {LEFT_TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`${tabBase} ${active ? "text-primary" : "text-muted"}`}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                />
              ) : null}
              <span aria-hidden="true">{tab.icon}</span>
              <span className="font-medium">{t(tab.labelKey)}</span>
            </Link>
          );
        })}

        {/* Center cell — spacer that hosts the raised Scan button overlay. */}
        <div className={`${tabBase} relative`} aria-hidden="true">
          <Link
            href="/scan"
            aria-label={t("tab_scan")}
            className="absolute -top-7 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-md"
          >
            <span aria-hidden="true">📷</span>
          </Link>
        </div>

        {RIGHT_TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`${tabBase} ${active ? "text-primary" : "text-muted"}`}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                />
              ) : null}
              <span aria-hidden="true">{tab.icon}</span>
              <span className="font-medium">{t(tab.labelKey)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          aria-pressed={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
          className={`${tabBase} ${moreOpen ? "text-primary" : "text-muted"}`}
        >
          {moreOpen ? (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-0.5 bg-primary"
            />
          ) : null}
          <span aria-hidden="true">⋯</span>
          <span className="font-medium">{t("tab_more")}</span>
        </button>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
