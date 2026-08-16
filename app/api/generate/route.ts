import { getDb } from "@/lib/db";
import { isYearMonth } from "@/lib/dates";
import { generateMonth } from "@/lib/pipeline";
import type { ProgressEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json()) as { month?: string };
  const month = body.month ?? "";
  if (!isYearMonth(month)) {
    return Response.json({ error: "Month must be YYYY-MM." }, { status: 400 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  async function send(event: ProgressEvent & { error?: string }) {
    await writer.write(encoder.encode(`${JSON.stringify(event)}\n`));
  }

  void (async () => {
    try {
      await generateMonth(getDb(), month, (event) => {
        void send(event);
      });
    } catch (error) {
      await send({
        stage: "error",
        message: error instanceof Error ? error.message : "Generate failed.",
        progress: 1,
        error: error instanceof Error ? error.message : "Generate failed.",
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
