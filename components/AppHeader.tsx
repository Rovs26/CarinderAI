import Image from "next/image";
import type { ReactNode } from "react";

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Optional pill rendered to the right of the title (e.g., a "Beta" tag
   * or a "+ New entry" CTA Link).
   */
  trailing?: ReactNode;
  /**
   * Show the small CarinderAI logo on the left. Defaults to true.
   */
  showLogo?: boolean;
}

/**
 * Sticky top header used by every page surface.
 *
 * - `top-bar` utility (defined in globals.css) applies the flat white bg
 *   plus 1px bottom border, matching the FB/YouTube-style design system.
 * - Sticky `top-0 z-40` so it sits above page content but below the
 *   bottom nav (z-30) — it lives inside the PhoneFrame, so it scrolls
 *   with the column on overscroll but stays pinned during normal scroll.
 * - The logo is loaded from `/assets/logo.png` (32x32 rounded-xl). Pass
 *   `showLogo={false}` to hide it on a page that needs more horizontal
 *   room (e.g., a deep detail page with a back link).
 *
 * Pure presentational and RSC-safe.
 */
export function AppHeader({
  title,
  subtitle,
  trailing,
  showLogo = true,
}: AppHeaderProps) {
  return (
    <header className="top-bar sticky top-0 z-40 px-4 py-3">
      <div className="flex items-center gap-3">
        {showLogo ? (
          <Image
            src="/assets/logo.png"
            alt="CarinderAI"
            width={32}
            height={32}
            className="rounded-xl shrink-0"
            priority
          />
        ) : null}
        <div className="flex flex-1 flex-col leading-tight">
          <h1 className="text-base font-semibold text-ink">{title}</h1>
          {subtitle ? (
            <p className="text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </header>
  );
}
