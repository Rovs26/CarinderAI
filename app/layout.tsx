import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SplashScreen } from "@/components/SplashScreen";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/Toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CarinderAI",
  description: "Operations app for Filipino carinderia owners.",
};

/**
 * Root app shell.
 *
 * Composition (Req 1.1–1.5, 1.7, 1.8, 13.2, 17.4–17.5):
 * - `LanguageProvider` wraps everything so `useT()` is available everywhere.
 * - `PhoneFrame` constrains the UI to the centered ≤480px column.
 * - `SplashScreen` overlays the frame on first session render only (sessionStorage-gated).
 * - `<main className="pb-20">{children}</main>` reserves ~80px at the bottom so
 *   page content is never hidden behind the fixed `BottomNav`.
 * - `Toaster` is rendered OUTSIDE the `PhoneFrame` so toasts can paint at the
 *   viewport top regardless of phone-frame chrome on desktop viewports.
 *
 * Inter (`--font-inter` → Tailwind `font-sans`) is applied at the body level
 * over a flat white surface (Req 1.7).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-screen">
        <LanguageProvider>
          <PhoneFrame>
            <SplashScreen />
            <main className="pb-20">{children}</main>
            <BottomNav />
          </PhoneFrame>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
