import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarinderAI",
  description:
    "Mobile assistant for Philippine carinderia owners — photo orders, daily finance, and demand forecast.",
  applicationName: "CarinderAI",
  manifest: "/manifest.json",
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
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
