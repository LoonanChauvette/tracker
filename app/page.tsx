import { getAiPublicState } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";
import { monthLabel } from "@/lib/dates";
import { listReports } from "@/lib/pipeline";
import type { ReportPayload } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const ai = getAiPublicState(db);
  const reports = listReports(db).map((row) => ({
    month: row.month,
    payload: JSON.parse(row.payloadJson) as ReportPayload,
  }));

  return (
    <main>
      <PageHeader
        title="Reports"
        description="Monthly ranked reading lists from your journals."
        action={
          <Link href="/generate" className="btn btn-primary">
            New digest
          </Link>
        }
      />

      {!ai.configured ? (
        <div className="panel mb-6 flex items-center justify-between gap-4 px-4 py-3">
          <p className="text-sm text-[var(--muted)]">Connect a model before generating.</p>
          <Link href="/setup" className="btn btn-ghost">
            Model
          </Link>
        </div>
      ) : null}

      {reports.length === 0 ? (
        <div className="panel px-4 py-10 text-center text-sm text-[var(--muted)]">
          No reports yet.
        </div>
      ) : (
        <div className="panel divide-y divide-[var(--border)]">
          {reports.map((report) => (
            <Link
              key={report.month}
              href={`/reports/${report.month}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[var(--bg)]"
            >
              <span className="text-sm font-medium">{monthLabel(report.month)}</span>
              <span className="text-xs text-[var(--muted)]">
                {report.payload.papers.length} papers · {report.payload.candidateCount} in
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
