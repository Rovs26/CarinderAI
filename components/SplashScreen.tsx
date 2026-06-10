"use client";

import { useEffect, useState } from "react";

const FLAG = "carinderai.splashShown";
const DURATION_MS = 1200;

/**
 * Cream-background splash overlay rendered inside the root layout.
 *
 * Behavior:
 * - SSR: renders nothing (returns null on the server).
 * - First render in a tab/session (no `sessionStorage[FLAG]`): displays the
 *   splash for ~1.2s, sets the flag, then unmounts.
 * - Subsequent renders in the same session: returns null immediately.
 *
 * No `/splash` route — this is purely an in-layout overlay.
 */
export function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(FLAG) === "1") return;
      setShow(true);
      window.sessionStorage.setItem(FLAG, "1");
      const t = setTimeout(() => setShow(false), DURATION_MS);
      return () => clearTimeout(t);
    } catch {
      // sessionStorage unavailable (e.g. privacy mode) — just don't show.
    }
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-2 bg-white"
    >
      <span aria-hidden="true" className="text-6xl">
        🍲
      </span>
      <span className="text-2xl font-bold text-primary">CarinderAI</span>
      <span className="text-sm text-muted">Mga laman ng tindahan mo.</span>
    </div>
  );
}
