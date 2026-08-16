import { addJournalByIssn, listJournals } from "@/lib/pipeline";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ journals: listJournals(getDb()) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { issn?: string };
    if (!body.issn) {
      return NextResponse.json({ error: "ISSN is required." }, { status: 400 });
    }
    const journal = await addJournalByIssn(getDb(), body.issn);
    return NextResponse.json({ journal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add journal." },
      { status: 400 },
    );
  }
}
