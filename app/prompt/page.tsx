import { PromptForm } from "@/components/prompt-form";
import { getDb } from "@/lib/db";
import { getPrompt, getTopN } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export default function PromptPage() {
  const db = getDb();

  return (
    <main>
      <h1 className="font-[var(--font-display)] text-4xl">Analysis prompt</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
        Scoring and the monthly synthesis both use this brief. Changing it will rescore papers the next time you generate a month.
      </p>
      <div className="mt-10">
        <PromptForm initialPrompt={getPrompt(db)} topN={getTopN(db)} />
      </div>
    </main>
  );
}
