import { ScoreBadge } from "@/components/score-badge";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title={report.monthLabel}
        description={`${report.journals.map((journal) => journal.title).join(" · ")} · ${report.candidateCount} candidates`}
        action={
          <Link href={`/api/reports/${report.month}/markdown`} className="btn btn-ghost">
            Markdown
          </Link>
        }
      />

      <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{report.intro}</p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {report.themes.map((theme) => (
          <span key={theme} className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted)] ring-1 ring-[var(--border)]">
            {theme}
          </span>
        ))}
      </div>

      <ol className="mt-8 space-y-4">
        {report.papers.map((paper, index) => (
          <li key={paper.doi} className="panel p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-1 text-[15px] font-medium leading-snug">
                  <a href={paper.url} className="hover:underline">
                    {paper.title}
                  </a>
                </h2>
                <p className="mt-2 text-xs text-[var(--muted)]">{paper.authors}</p>
                <p className="text-xs text-[var(--muted)]">
                  {paper.journalTitle}
                  {paper.publishedDate ? ` · ${paper.publishedDate}` : ""}
                </p>
              </div>
              <ScoreBadge score={paper.score} />
            </div>
            <p className="mt-3 text-sm">{paper.reason}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{paper.summary}</p>
            <a href={paper.url} className="mt-3 inline-block text-xs text-[var(--muted)] hover:text-[var(--text)]">
              {paper.doi}
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-[11px] text-[var(--muted)]">
        {report.model} · {report.promptHash.slice(0, 12)}
      </p>
    </article>
  );
}
