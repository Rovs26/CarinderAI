"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/owner", label: "Dashboard" },
  { href: "/capture-order", label: "Capture Order" },
  { href: "/finance", label: "Finance" },
  { href: "/forecast", label: "Forecast" },
  { href: "/discover", label: "Discover" },
  { href: "/suppliers", label: "Suppliers" },
];

export function NavBar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white">
            C
          </span>
          CarinderAI
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-orange-50 text-[var(--color-accent)]"
                    : "text-[var(--color-muted)] hover:bg-stone-50 hover:text-[var(--color-foreground)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/capture-order"
          className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          New Order
        </Link>
      </div>
    </header>
  );
}
