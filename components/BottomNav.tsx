"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/owner",
    label: "Dashboard",
    match: (p: string) => p === "/owner" || p === "/",
  },
  { href: "/capture-order", label: "Capture", match: (p: string) => p === "/capture-order" },
  { href: "/finance", label: "Finance", match: (p: string) => p === "/finance" },
  { href: "/forecast", label: "Forecast", match: (p: string) => p === "/forecast" },
  { href: "/suppliers", label: "Suppliers", match: (p: string) => p === "/suppliers" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <ul className="grid grid-cols-5 px-1 pt-1">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium leading-tight transition-colors ${
                  active
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${
                    active ? "bg-orange-100/80" : ""
                  }`}
                  aria-hidden
                >
                  {tab.label === "Dashboard" && "▦"}
                  {tab.label === "Capture" && "◉"}
                  {tab.label === "Finance" && "₱"}
                  {tab.label === "Forecast" && "☀"}
                  {tab.label === "Suppliers" && "▤"}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
