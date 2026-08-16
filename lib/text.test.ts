import { describe, expect, it } from "vitest";
import { formatAuthors, normalizeIssn, publishedDateFromParts, stripJats } from "@/lib/text";

describe("text helpers", () => {
  it("normalizes ISSNs", () => {
    expect(normalizeIssn("01960202")).toBe("0196-0202");
    expect(normalizeIssn("0196-0202")).toBe("0196-0202");
    expect(normalizeIssn("1538-466X")).toBe("1538-466X");
    expect(normalizeIssn("123")).toBeNull();
  });

  it("strips JATS abstracts", () => {
    expect(
      stripJats("<jats:p>Hearing-aid gain <jats:italic>improved</jats:italic> speech.</jats:p>"),
    ).toBe("Hearing-aid gain improved speech.");
  });

  it("formats authors and dates", () => {
    expect(formatAuthors([{ given: "Jane", family: "Smith" }, { given: "A.", family: "Lee" }])).toBe(
      "Jane Smith, A. Lee",
    );
    expect(publishedDateFromParts([[2026, 3]])).toBe("2026-03-01");
  });
});
