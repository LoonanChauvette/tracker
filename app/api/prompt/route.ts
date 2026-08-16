import { getDb } from "@/lib/db";
import { getPrompt, getTopN, setPrompt } from "@/lib/pipeline";
import { settings } from "@/lib/schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  return NextResponse.json({ prompt: getPrompt(db), topN: getTopN(db) });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { prompt?: string; topN?: number };
  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt cannot be empty." }, { status: 400 });
  }
  const db = getDb();
  setPrompt(db, prompt);
  if (typeof body.topN === "number" && body.topN > 0 && body.topN <= 50) {
    db.insert(settings)
      .values({ key: "top_n", value: String(Math.round(body.topN)) })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: String(Math.round(body.topN)) },
      })
      .run();
  }
  return NextResponse.json({ ok: true });
}
