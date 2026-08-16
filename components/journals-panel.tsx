"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Journal = {
  id: number;
  issn: string;
  title: string;
  publisher: string | null;
};

type SearchHit = {
  issn: string;
  title: string;
  publisher: string | null;
};

export function JournalsPanel({ journals }: { journals: Journal[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trackedIssns = useMemo(
    () => new Set(journals.map((journal) => journal.issn)),
    [journals],
  );

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/journals/search?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { journals?: SearchHit[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Search failed.");
      setHits(data.journals ?? []);
      if (!(data.journals ?? []).length) setMessage("No journals matched that query.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addIssn(issn: string) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issn }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not add journal.");
      setHits([]);
      setQuery("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add journal.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/journals/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not remove journal.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove journal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or ISSN, e.g. 0196-0202"
          className="flex-1 border border-[var(--rule)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="bg-[var(--accent)] px-4 py-2 text-sm text-[var(--card)] disabled:opacity-50"
        >
          Search Crossref
        </button>
      </form>

      {message ? <p className="text-sm text-[var(--accent-2)]">{message}</p> : null}

      {hits.length > 0 ? (
        <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)] bg-[var(--card)]">
          {hits.map((hit) => (
            <li key={hit.issn} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium">{hit.title}</p>
                <p className="text-sm text-[var(--ink-soft)]">
                  {hit.issn}
                  {hit.publisher ? ` · ${hit.publisher}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busy || trackedIssns.has(hit.issn)}
                onClick={() => addIssn(hit.issn)}
                className="text-sm text-[var(--accent)] disabled:text-[var(--ink-soft)]"
              >
                {trackedIssns.has(hit.issn) ? "Tracked" : "Add"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <section>
        <h2 className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
          Tracked journals
        </h2>
        <ul className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {journals.map((journal) => (
            <li key={journal.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-[var(--font-display)] text-2xl">{journal.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  ISSN {journal.issn}
                  {journal.publisher ? ` · ${journal.publisher}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(journal.id)}
                className="text-sm text-[var(--ink-soft)] hover:text-[var(--accent-2)]"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
