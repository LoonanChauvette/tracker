export function lastCalendarMonth(now = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return formatMonth(date.getFullYear(), date.getMonth() + 1);
}

export function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isYearMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthRange(month: string): { from: string; until: string } {
  if (!isYearMonth(month)) {
    throw new Error(`Invalid month: ${month}`);
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    from: `${month}-01`,
    until: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function monthLabel(month: string): string {
  if (!isYearMonth(month)) return month;
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}
