import { getDb } from "@/lib/db";
import { getReport } from "@/lib/pipeline";
import { reportToMarkdown } from "@/lib/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  const { month } = await params;
  const report = getReport(getDb(), month);
  if (!report) {
    return new Response("Report not found.", { status: 404 });
  }

  return new Response(reportToMarkdown(report), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="tracker-${month}.md"`,
    },
  });
}
