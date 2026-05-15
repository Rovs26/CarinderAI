type SectionHeaderProps = {
  title: string;
  description?: string;
};

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>
      )}
    </div>
  );
}
