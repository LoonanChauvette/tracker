import { getAiPublicState } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";
import { monthLabel } from "@/lib/dates";
import { listReports } from "@/lib/pipeline";
import type { ReportPayload } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const ai = getAiPublicState(db);
  const reports = listReports(db).map((row) => ({
    month: row.month,
    createdAt: row.createdAt,
    payload: JSON.parse(row.payloadJson) as ReportPayload,
  }));

  return (
    <main>
      <p className="font-[var(--font-display)] text-3xl leading-snug text-[var(--ink)]">
        A monthly reading list from the journals you follow, ranked by your own prompt.
      </p>
      <p className="mt-4 max-w-2xl text-[var(--ink-soft)]">
        The MVP tracks <em>Ear and Hearing</em>. Add more titles, edit the analysis prompt, then generate a digest for any month.
      </p>

      {!ai.configured ? (
        <div className="mt-10 border border-[var(--rule)] bg-[var(--card)] p-5">
          <p className="font-[var(--font-display)] text-2xl">Connect a model first</p>
          <p className="mt-2 max-w-xl text-sm text-[var(--ink-soft)]">
            Scoring needs an OpenAI-compatible provider. Choose OpenAI, Groq, OpenRouter, or a local Ollama model — no env files required.
          </p>
          <Link
            href="/setup"
            className="mt-4 inline-block bg-[var(--accent)] px-4 py-2 text-sm text-[var(--card)]"
          >
            Set up AI
          </Link>
        </div>
      ) : (
        <div className="mt-10 flex gap-3">
          <Link
            href="/generate"
            className="bg-[var(--accent)] px-4 py-2 text-sm text-[var(--card)]"
          >
            Generate a month
          </Link>
          <Link
            href="/journals"
            className="border border-[var(--rule)] px-4 py-2 text-sm"
          >
            Manage journals
          </Link>
        </div>
      )}

      <section className="mt-14">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
          Past reports
        </h2>
        {reports.length === 0 ? (
          <p className="mt-4 text-[var(--ink-soft)]">
            No reports yet. Generate last month to see the first digest.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {reports.map((report) => (
              <li key={report.month}>
                <Link
                  href={`/reports/${report.month}`}
                  className="flex items-baseline justify-between gap-6 py-4 hover:bg-[var(--card)]"
                >
                  <span className="font-[var(--font-display)] text-2xl">
                    {monthLabel(report.month)}
                  </span>
                  <span className="text-sm text-[var(--ink-soft)]">
                    {report.payload.papers.length} papers · {report.payload.candidateCount} candidates
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
