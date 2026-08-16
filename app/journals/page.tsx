import { JournalsPanel } from "@/components/journals-panel";
import { PageHeader } from "@/components/page-header";
import { getDb } from "@/lib/db";
import { listJournals } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export default function JournalsPage() {
  return (
    <main>
      <PageHeader
        title="Journals"
        description="Type a title or ISSN. Results appear as you type."
      />
      <JournalsPanel journals={listJournals(getDb())} />
    </main>
  );
}
