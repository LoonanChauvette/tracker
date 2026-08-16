import { AiSetupForm } from "@/components/ai-setup-form";
import { PageHeader } from "@/components/page-header";
import { getAiPublicState } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <main>
      <PageHeader
        title="Model"
        description="Provider, model, and usage for scoring. Keys stay on this machine."
      />
      <AiSetupForm initial={getAiPublicState(getDb())} />
    </main>
  );
}
