export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="shrink-0 rounded-md bg-[var(--bg)] px-2 py-1 text-sm font-medium tabular-nums">
      {Math.round(score)}
    </span>
  );
}
