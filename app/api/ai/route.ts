import { getAiPublicState, saveAiSettings } from "@/lib/ai-settings";
import { isProviderId } from "@/lib/ai-providers";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getAiPublicState(getDb()));
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
    saveAiSettings(getDb(), {
      provider: body.provider,
      model: body.model ?? "",
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
      clearKey: body.clearKey,
    });
    return NextResponse.json(getAiPublicState(getDb()));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save AI settings." },
      { status: 400 },
    );
  }
}
