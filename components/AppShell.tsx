import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
};

export function AppShell({
  children,
  title,
  subtitle,
  hideHeader = false,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[#ebe6dc]">
      <div className="glass-phone relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col shadow-[0_0_56px_rgba(28,25,23,0.14)]">
        {!hideHeader && <AppHeader title={title} subtitle={subtitle} />}
        <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
