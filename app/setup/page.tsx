import { AiSetupForm } from "@/components/ai-setup-form";
import { getAiPublicState } from "@/lib/ai-settings";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const initial = getAiPublicState(getDb());

  return (
    <main>
      <h1 className="font-[var(--font-display)] text-4xl">AI setup</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
        Pick a provider, paste a key, and test it. Tracker only talks to OpenAI-compatible APIs. Your key is stored in the local database and is never sent back to the browser.
      </p>
      <div className="mt-10">
        <AiSetupForm initial={initial} />
      </div>
    </main>
  );
}
