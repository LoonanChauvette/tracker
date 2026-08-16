import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, type TrackerDb } from "@/lib/db";
import { generateMonth, rankPapers } from "@/lib/pipeline";
import { settings } from "@/lib/schema";
import { EAR_AND_HEARING } from "@/lib/seed";
import type { CrossrefWork } from "@/lib/crossref";

const fixtures: CrossrefWork[] = [
  {
    doi: "10.1097/aud.00000000001001",
    title: "Editorial: welcome from the editor",
    authors: "Editor",
    abstract: "An editorial note.",
    publishedDate: "2026-03-01",
    url: "https://doi.org/10.1097/aud.00000000001001",
    containerTitle: "Ear and Hearing",
  },
  {
    doi: "10.1097/aud.00000000001002",
    title: "Cochlear implant outcomes in older adults",
    authors: "Jane Smith, A. Lee",
    abstract: "A prospective study of speech recognition after implantation.",
    publishedDate: "2026-03-18",
    url: "https://doi.org/10.1097/aud.00000000001002",
    containerTitle: "Ear and Hearing",
  },
  {
    doi: "10.1097/aud.00000000001003",
    title: "Hearing-aid directional microphones in noise",
    authors: "R. Clinician",
    abstract: "Lab and field evaluation of directional processing.",
    publishedDate: "2026-03-08",
    url: "https://doi.org/10.1097/aud.00000000001003",
    containerTitle: "Ear and Hearing",
  },
];

function tempDb(): { db: TrackerDb; dir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracker-"));
  return { db: openDatabase(path.join(dir, "tracker.db")), dir };
}

describe("pipeline", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
    dirs.length = 0;
  });

  it("ranks by score then recency", () => {
    const ranked = rankPapers(
      [
        { score: 70, publishedDate: "2026-03-20" },
        { score: 90, publishedDate: "2026-03-01" },
        { score: 90, publishedDate: "2026-03-10" },
      ],
      2,
    );
    expect(ranked.map((item) => item.publishedDate)).toEqual(["2026-03-10", "2026-03-01"]);
  });

  it("generates a monthly Ear and Hearing report from fixtures", async () => {
    const { db, dir } = tempDb();
    dirs.push(dir);
    db.insert(settings)
      .values({ key: "top_n", value: "2" })
      .onConflictDoUpdate({ target: settings.key, set: { value: "2" } })
      .run();

    const report = await generateMonth(db, "2026-03", () => undefined, {
      fetchMonthWorks: async () => fixtures,
      scorePapers: async (papers) =>
        papers.map((paper) => ({
          doi: paper.doi,
          score: paper.title.startsWith("Editorial") ? 12 : paper.title.includes("Cochlear") ? 94 : 81,
          reason: paper.title.startsWith("Editorial")
            ? "Editorial rather than original research."
            : "Directly relevant clinical methods paper.",
          summary: paper.abstract ?? "",
        })),
      synthesizeReport: async () => ({
        intro: "Two clinical papers outranked an editorial.",
        themes: ["Cochlear implants", "Hearing aids"],
      }),
      getModelName: () => "test-model",
    });

    expect(report.journals[0]?.issn).toBe(EAR_AND_HEARING.issn);
    expect(report.candidateCount).toBe(3);
    expect(report.papers.map((paper) => paper.title)).toEqual([
      "Cochlear implant outcomes in older adults",
      "Hearing-aid directional microphones in noise",
    ]);
    expect(report.papers[0]?.score).toBe(94);
    expect(report.themes).toContain("Cochlear implants");
    expect(report.model).toBe("test-model");
  });
});
