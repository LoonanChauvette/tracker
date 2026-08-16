import { JournalsPanel } from "@/components/journals-panel";
import { getDb } from "@/lib/db";
import { listJournals } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export default function JournalsPage() {
  const journals = listJournals(getDb());

  return (
    <main>
      <h1 className="font-[var(--font-display)] text-4xl">Journals</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
        Tracker pulls monthly articles from Crossref by ISSN. <em>Ear and Hearing</em> is seeded as the flagship audiology journal. Add any other title you follow.
      </p>
      <div className="mt-10">
        <JournalsPanel journals={journals} />
      </div>
    </main>
  );
}
