import { describe, expect, it } from "vitest";
import { isYearMonth, lastCalendarMonth, monthLabel, monthRange } from "@/lib/dates";

describe("dates", () => {
  it("formats last calendar month", () => {
    expect(lastCalendarMonth(new Date(2026, 7, 16))).toBe("2026-07");
  });

  it("builds inclusive Crossref ranges including month length", () => {
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", until: "2026-02-28" });
    expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", until: "2024-02-29" });
  });

  it("rejects invalid months", () => {
    expect(isYearMonth("2026-13")).toBe(false);
    expect(() => monthRange("2026-13")).toThrow(/Invalid month/);
  });

  it("labels months", () => {
    expect(monthLabel("2026-03")).toBe("March 2026");
  });
});
