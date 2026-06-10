import type { ReactNode } from "react";

export interface PhoneFrameProps {
  children: ReactNode;
}

/**
 * App shell wrapper.
 *
 * Mobile (<sm): inner container fills the viewport. Desktop (>=sm):
 * the FB-signature gray (#f0f2f5) page background frames a centered
 * max-w-[480px] white column with thin vertical 1px borders. Flat —
 * no shadow, no rounded chrome, no glass effect.
 */
export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="min-h-dvh bg-section">
      <div className="mx-auto w-full max-w-[480px] min-h-dvh bg-white sm:border-x sm:border-border">
        {children}
      </div>
    </div>
  );
}
