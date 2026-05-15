import Link from "next/link";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-bold text-white"
          aria-label="CarinderAI home"
        >
          C
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-tight">
            {title ?? "CarinderAI"}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-[var(--color-muted)]">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
