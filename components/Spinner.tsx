interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  const wrapperClasses = [
    "flex flex-col items-center justify-center gap-2 py-6",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses} role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
      />
      {label ? (
        <span className="text-sm text-muted">{label}</span>
      ) : (
        <span className="sr-only">Loading…</span>
      )}
    </div>
  );
}
