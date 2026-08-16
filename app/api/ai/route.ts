import {
  cacheModels,
  fetchOpenRouterUsage,
  fetchProviderModels,
  getAiPublicState,
  resolveAiConfig,
  saveAiSettings,
} from "@/lib/ai-settings";
import { isProviderId } from "@/lib/ai-providers";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const state = getAiPublicState(db);
  if (state.configured && state.provider === "openrouter") {
    try {
      const config = resolveAiConfig(db);
      state.remote = await fetchOpenRouterUsage(config.apiKey);
    } catch {
      state.remote = null;
    }
  }
  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: string;
      model?: string;
      apiKey?: string;
      baseUrl?: string;
      clearKey?: boolean;
    };
    if (!body.provider || !isProviderId(body.provider)) {
      return NextResponse.json({ error: "Choose a provider." }, { status: 400 });
    }
    const db = getDb();
    saveAiSettings(db, {
      provider: body.provider,
      model: body.model ?? "",
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
      clearKey: body.clearKey,
    });
    try {
      const config = resolveAiConfig(db);
      const models = await fetchProviderModels(config);
      cacheModels(db, models);
    } catch {
      // Model lists are optional; a valid key can still score papers.
    }
    return NextResponse.json(getAiPublicState(db));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save AI settings." },
      { status: 400 },
    );
  }
}
