import { describe, expect, it } from "vitest";
import { reportToMarkdown } from "@/lib/report";
import type { ReportPayload } from "@/lib/types";

const fixture: ReportPayload = {
  month: "2026-03",
  monthLabel: "March 2026",
  journals: [{ title: "Ear and Hearing", issn: "0196-0202" }],
  candidateCount: 3,
  topN: 2,
  intro: "Cochlear implant outcomes led the month.",
  themes: ["Cochlear implants", "Speech in noise"],
  papers: [
    {
      doi: "10.1097/aud.0000000000000001",
      title: "Bimodal fitting in adults",
      authors: "A. Audiologist",
      journalTitle: "Ear and Hearing",
      publishedDate: "2026-03-12",
      url: "https://doi.org/10.1097/aud.0000000000000001",
      score: 91,
      reason: "Clear clinical trial in the target population.",
      summary: "A randomized study of bimodal fitting.",
    },
  ],
  model: "gpt-4.1-mini",
  promptHash: "abc123def4567890",
};

describe("report markdown", () => {
  it("renders a structured digest", () => {
    const markdown = reportToMarkdown(fixture);
    expect(markdown).toContain("# March 2026");
    expect(markdown).toContain("Ear and Hearing (0196-0202)");
    expect(markdown).toContain("Bimodal fitting in adults");
    expect(markdown).toContain("Prompt hash: `abc123def456`");
  });
});
