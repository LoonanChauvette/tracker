import { AI_PROVIDERS, isProviderId } from "@/lib/ai-providers";
import {
  explainAiError,
  getAiPublicState,
  resolveAiConfig,
  testAiConnection,
} from "@/lib/ai-settings";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: string;
      model?: string;
      apiKey?: string;
      baseUrl?: string;
    };

    const db = getDb();
    const saved = getAiPublicState(db);
    const providerId =
      body.provider && isProviderId(body.provider) ? body.provider : saved.provider;
    const provider = AI_PROVIDERS[providerId];
    const model = body.model?.trim() || saved.model || provider.defaultModel;
    const pastedKey = body.apiKey?.trim();
    let apiKey = pastedKey || "";
    let baseURL =
      body.baseUrl?.trim() ||
      (provider.baseUrlEditable ? saved.baseUrl : provider.defaultBaseUrl) ||
      undefined;

    if (!pastedKey) {
      try {
        const resolved = resolveAiConfig(db);
        apiKey = resolved.apiKey;
        if (!body.baseUrl?.trim()) baseURL = resolved.baseURL;
      } catch {
        apiKey = provider.needsKey ? "" : "ollama";
      }
    }

    if (!provider.needsKey && !apiKey) apiKey = "ollama";

    const reply = await testAiConnection({
      apiKey,
      baseURL,
      model,
    });

    return NextResponse.json({
      ok: true,
      message: `Connected. ${provider.label} answered with “${reply.slice(0, 80)}”.`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: explainAiError(error) },
      { status: 400 },
    );
  }
}
