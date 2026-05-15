import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const features = [
  {
    href: "/capture-order",
    title: "Camera order",
    desc: "Photo your handwritten list → supplier draft",
    accent: true,
  },
  {
    href: "/finance",
    title: "Finance tracker",
    desc: "Revenue, expenses, profit today",
    accent: false,
  },
  {
    href: "/forecast",
    title: "Demand forecast",
    desc: "Prep level and ingredient budget",
    accent: false,
  },
];

const impactPoints = [
  "Built for owners who still use paper lists",
  "Reduces manual typing",
  "Helps estimate daily profit",
  "Supports smarter food preparation",
];

export default function LandingPage() {
  return (
    <AppShell title="CarinderAI" subtitle="Lutong bahay, smarter ops">
      <section className="card border-orange-200 bg-orange-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          For carinderia owners
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-snug">
          Paper list → digital supplier order
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Snap your handwritten order, confirm items, and prep your palengke run.
        </p>
        <div className="mt-5 space-y-2">
          <Link href="/capture-order" className="btn-primary">
            Capture order
          </Link>
          <Link href="/owner" className="btn-secondary">
            Owner dashboard
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">Quick tools</h2>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f.href}>
              <Link
                href={f.href}
                className={`card block active:scale-[0.99] ${
                  f.accent ? "border-orange-200 ring-1 ring-orange-100" : ""
                }`}
              >
                <p className="font-semibold">{f.title}</p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{f.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-6">
        <h2 className="text-sm font-semibold">Why CarinderAI</h2>
        <ul className="mt-3 space-y-2">
          {impactPoints.map((point) => (
            <li key={point} className="flex gap-2 text-sm text-stone-700">
              <span className="text-[var(--color-accent)]" aria-hidden>
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/discover" className="card text-center text-sm font-medium active:bg-stone-50">
          Discover dishes
        </Link>
        <Link href="/suppliers" className="card text-center text-sm font-medium active:bg-stone-50">
          Find suppliers
        </Link>
      </section>

      <p className="mt-8 text-center text-xs text-[var(--color-muted)]">
        Add to Home Screen for an app-like experience
      </p>
    </AppShell>
  );
}
