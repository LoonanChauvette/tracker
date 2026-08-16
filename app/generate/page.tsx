import { GenerateForm } from "@/components/generate-form";
import { PageHeader } from "@/components/page-header";
import { getAiPublicState } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function GeneratePage() {
  const ai = getAiPublicState(getDb());
  return (
    <main>
      <PageHeader
        title="Generate"
        description="Fetch the month, score new papers, write the digest."
      />
      <GenerateForm aiReady={ai.configured} />
    </main>
  );
}
