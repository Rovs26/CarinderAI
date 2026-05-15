import type { Metadata, Viewport } from "next";
import { ASSETS } from "@/lib/assets";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarinderAI",
  description:
    "Mobile assistant for Philippine carinderia owners — photo orders, daily finance, and demand forecast.",
  applicationName: "CarinderAI",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: ASSETS.appIcon, type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: ASSETS.appIcon, type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "CarinderAI",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
