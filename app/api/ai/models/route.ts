import { cacheModels, fetchProviderModels, resolveAiConfig } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const config = resolveAiConfig(db);
    const models = await fetchProviderModels(config);
    cacheModels(db, models);
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not list models." },
      { status: 400 },
    );
  }
}
