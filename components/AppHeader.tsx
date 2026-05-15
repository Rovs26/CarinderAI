import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="glass-header sticky top-0 z-40 px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="CarinderAI home">
          <Image
            src={ASSETS.logoMark}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-xl object-contain"
            priority
          />
          <span className="sr-only">CarinderAI</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-tight text-[var(--color-foreground)]">
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
