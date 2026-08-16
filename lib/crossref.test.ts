import { describe, expect, it, vi } from "vitest";
import { fetchMonthWorks, searchJournals } from "@/lib/crossref";

describe("crossref mapping", () => {
  it("maps a journal ISSN lookup", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: {
            title: "Ear and Hearing",
            publisher: "Wolters Kluwer Health",
            ISSN: ["0196-0202", "1538-4667"],
          },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const results = await searchJournals("0196-0202", fetchImpl);
    expect(results).toEqual([
      {
        issn: "0196-0202",
        title: "Ear and Hearing",
        publisher: "Wolters Kluwer Health",
      },
    ]);
  });

  it("maps monthly works and strips abstracts", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: {
            items: [
              {
                DOI: "10.1097/aud.00000000009999",
                title: ["A test of spatial hearing"],
                author: [{ given: "Pat", family: "Listener" }],
                abstract: "<jats:p>Listeners localized noise bursts.</jats:p>",
                URL: "https://doi.org/10.1097/aud.00000000009999",
                "container-title": ["Ear and Hearing"],
                published: { "date-parts": [[2026, 3, 4]] },
              },
            ],
            "next-cursor": undefined,
          },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const works = await fetchMonthWorks("0196-0202", "2026-03", fetchImpl);
    expect(works).toHaveLength(1);
    expect(works[0]?.abstract).toBe("Listeners localized noise bursts.");
    expect(works[0]?.authors).toBe("Pat Listener");
  });
});
