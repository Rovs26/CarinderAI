import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ASSETS } from "@/lib/assets";

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

        <div className="relative mt-4 aspect-[5/2] w-full overflow-hidden rounded-xl border border-orange-100 bg-white/80">
          <Image
            src={ASSETS.heroBanner}
            alt="Carinderia owner using a phone to capture a handwritten supplier order list"
            fill
            className="object-cover object-center"
            sizes="(max-width: 480px) 100vw, 480px"
            priority
          />
        </div>

        <div className="mt-5 space-y-2">
          <Link href="/capture-order" className="btn-primary">
            Capture order
          </Link>
          <Link href="/owner" className="btn-secondary">
            Owner dashboard
          </Link>
        </div>
        <p className="mt-4 text-center">
          <a
            href="#story"
            className="text-sm font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            Read our story
          </a>
        </p>
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

      <section id="story" className="card-warm card mt-6 scroll-mt-28">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          About CarinderAI
        </p>
        <h2 className="mt-2 text-lg font-bold leading-snug">Our Story</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700">
          <p>
            CarinderAI was born from a simple idea: help carinderia owners spend less time on
            manual work and more time serving affordable meals to their community.
          </p>
          <p>
            Traditional eateries like carinderias and turo-turo have always been close to Filipino
            daily life, but many still manage orders, supplies, sales, and planning through paper
            lists and memory.
          </p>
          <p>
            CarinderAI brings that daily workflow into one simple mobile app: capture paper supplier
            lists, prepare order drafts, track daily profit, and plan for tomorrow&apos;s demand.
          </p>
        </div>
        <blockquote className="mt-4 rounded-xl border border-orange-200/70 bg-white/55 px-3 py-3 text-sm leading-relaxed text-stone-700">
          <span className="text-[var(--color-accent)]" aria-hidden>
            &ldquo;
          </span>
          Built for owners who still use paper lists, but deserve better tools.
          <span className="text-[var(--color-accent)]" aria-hidden>
            &rdquo;
          </span>
        </blockquote>
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
