import { getDb } from "@/lib/db";
import { removeJournal } from "@/lib/pipeline";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid journal id." }, { status: 400 });
  }
  removeJournal(getDb(), numericId);
  return NextResponse.json({ ok: true });
}
