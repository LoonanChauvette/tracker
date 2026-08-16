export function formatTokenCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const value = n / 1000;
    return `${value < 10 ? value.toFixed(1) : Math.round(value).toString()}k`;
  }
  return `${(n / 1_000_000).toFixed(1)}M`;
}
