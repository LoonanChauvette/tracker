import { GenerateForm } from "@/components/generate-form";
import { getAiPublicState } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function GeneratePage() {
  const ai = getAiPublicState(getDb());

  return (
    <main>
      <h1 className="font-[var(--font-display)] text-4xl">Generate</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
        Fetches the selected month from Crossref, scores new papers against your prompt, and writes a structured digest. Already-scored DOIs are skipped.
      </p>
      <div className="mt-10">
        <GenerateForm aiReady={ai.configured} />
      </div>
    </main>
  );
}
