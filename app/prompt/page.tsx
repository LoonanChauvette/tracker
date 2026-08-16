import { PromptForm } from "@/components/prompt-form";
import { PageHeader } from "@/components/page-header";
import { getDb } from "@/lib/db";
import { getPrompt, getTopN } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export default function PromptPage() {
  const db = getDb();
  return (
    <main>
      <PageHeader
        title="Prompt"
        description="Used to score papers and write the monthly synthesis."
      />
      <PromptForm initialPrompt={getPrompt(db)} topN={getTopN(db)} />
    </main>
  );
}
