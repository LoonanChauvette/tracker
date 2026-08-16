export function ScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score);
  return (
    <span className="inline-flex min-w-12 items-baseline justify-end font-[var(--font-display)] text-2xl tabular-nums text-[var(--accent-2)]">
      {rounded}
      <span className="ml-1 text-xs font-[var(--font-sans)] uppercase tracking-wider text-[var(--ink-soft)]">
        pts
      </span>
    </span>
  );
}
