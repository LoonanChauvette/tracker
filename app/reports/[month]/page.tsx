import { ScoreBadge } from "@/components/score-badge";
import { getDb } from "@/lib/db";
import { getReport } from "@/lib/pipeline";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const report = getReport(getDb(), month);
  if (!report) notFound();

  return (
    <article>
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
        Monthly report
      </p>
      <h1 className="mt-2 font-[var(--font-display)] text-5xl leading-tight">
        {report.monthLabel}
      </h1>
      <p className="mt-4 text-sm text-[var(--ink-soft)]">
        {report.journals.map((journal) => journal.title).join(" · ")} · {report.candidateCount} candidates · top {report.papers.length}
      </p>
      <p className="mt-8 max-w-3xl text-lg leading-relaxed">{report.intro}</p>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
          Themes
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {report.themes.map((theme) => (
            <li
              key={theme}
              className="border border-[var(--rule)] bg-[var(--card)] px-3 py-1 text-sm"
            >
              {theme}
            </li>
          ))}
        </ul>
      </section>

      <ol className="mt-12 space-y-10">
        {report.papers.map((paper, index) => (
          <li key={paper.doi} className="border-t border-[var(--rule)] pt-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-2 max-w-3xl font-[var(--font-display)] text-3xl leading-snug">
                  <a href={paper.url} className="hover:text-[var(--accent)]">
                    {paper.title}
                  </a>
                </h2>
              </div>
              <ScoreBadge score={paper.score} />
            </div>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">{paper.authors}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {paper.journalTitle}
              {paper.publishedDate ? ` · ${paper.publishedDate}` : ""}
            </p>
            <p className="mt-4 max-w-3xl">
              <span className="font-medium">Why it matched. </span>
              {paper.reason}
            </p>
            <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">{paper.summary}</p>
            <p className="mt-4 text-sm">
              <a href={paper.url} className="text-[var(--accent)]">
                {paper.doi}
              </a>
            </p>
          </li>
        ))}
      </ol>

      <footer className="mt-16 border-t border-[var(--rule)] pt-6 text-sm text-[var(--ink-soft)]">
        <p>
          Model {report.model}. Prompt hash {report.promptHash.slice(0, 12)}.
        </p>
        <p className="mt-2">
          <Link href={`/api/reports/${report.month}/markdown`} className="text-[var(--accent)]">
            Download markdown
          </Link>
        </p>
      </footer>
    </article>
  );
}
