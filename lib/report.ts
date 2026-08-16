import type { ReportPayload } from "./types";

export function reportToMarkdown(report: ReportPayload): string {
  const lines = [
    `# ${report.monthLabel}`,
    "",
    report.intro,
    "",
    `Tracked journals: ${report.journals.map((journal) => `${journal.title} (${journal.issn})`).join("; ")}`,
    `Candidates this month: ${report.candidateCount}. Showing top ${Math.min(report.topN, report.papers.length)}.`,
    "",
    "## Themes",
    "",
    ...report.themes.map((theme) => `- ${theme}`),
    "",
    "## Ranked papers",
    "",
  ];

  report.papers.forEach((paper, index) => {
    lines.push(
      `### ${index + 1}. ${paper.title}`,
      "",
      `${paper.authors}`,
      "",
      `${paper.journalTitle}${paper.publishedDate ? ` · ${paper.publishedDate}` : ""} · score ${Math.round(paper.score)}`,
      "",
      `[${paper.doi}](${paper.url})`,
      "",
      `**Why it matched:** ${paper.reason}`,
      "",
      paper.summary,
      "",
    );
  });

  lines.push(
    "---",
    "",
    `Model: ${report.model}. Prompt hash: \`${report.promptHash.slice(0, 12)}\`.`,
    "",
  );

  return lines.join("\n");
}
