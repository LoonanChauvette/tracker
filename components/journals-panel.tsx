"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const trackedIssns = useMemo(
    () => new Set(journals.map((journal) => journal.issn)),
    [journals],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/journals/search?q=${encodeURIComponent(trimmed)}`);
        const data = (await response.json()) as { journals?: SearchHit[] };
        const next = data.journals ?? [];
        setHits(next);
        setActive(0);
        setOpen(next.length > 0);
        setMessage(next.length ? null : "No journals match.");
      } catch {
        setMessage("Search failed.");
      }
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

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
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add journal.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    try {
      const response = await fetch(`/api/journals/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not remove journal.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove journal.");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !hits.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => (value + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => (value - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[active];
      if (hit && !trackedIssns.has(hit.issn)) void addIssn(hit.issn);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <div ref={boxRef} className="relative">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => hits.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search journals by title or ISSN"
          className="field"
          role="combobox"
          aria-expanded={open}
          aria-controls="journal-results"
          aria-autocomplete="list"
        />
        {open ? (
          <ul
            id="journal-results"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
          >
            {hits.map((hit, index) => {
              const tracked = trackedIssns.has(hit.issn);
              return (
                <li key={hit.issn}>
                  <button
                    type="button"
                    disabled={busy || tracked}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => addIssn(hit.issn)}
                    className={`flex w-full items-start justify-between gap-4 px-3 py-2 text-left text-sm ${
                      index === active ? "bg-[var(--bg)]" : ""
                    }`}
                  >
                    <span>
                      <span className="block font-medium">{hit.title}</span>
                      <span className="text-[var(--muted)]">
                        {hit.issn}
                        {hit.publisher ? ` · ${hit.publisher}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] text-[var(--muted)]">
                      {tracked ? "Added" : "Add"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {message && !open ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
        ) : null}
      </div>

      <div className="panel divide-y divide-[var(--border)]">
        {journals.map((journal) => (
          <div key={journal.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{journal.title}</p>
              <p className="text-xs text-[var(--muted)]">
                {journal.issn}
                {journal.publisher ? ` · ${journal.publisher}` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(journal.id)}
              className="text-xs text-[var(--muted)] hover:text-[var(--danger)]"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
