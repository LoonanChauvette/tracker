"use client";

import { useState } from "react";

export function PromptForm({ initialPrompt, topN }: { initialPrompt: string; topN: number }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [count, setCount] = useState(topN);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, topN: count }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save.");
      setStatus("Saved. The next generate run will rescore papers if the prompt changed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <label className="block">
        <span className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
          Analysis prompt
        </span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={12}
          className="mt-2 w-full border border-[var(--rule)] bg-[var(--card)] px-3 py-3 leading-relaxed outline-none focus:border-[var(--accent)]"
        />
      </label>
      <label className="block max-w-xs">
        <span className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
          Top papers to keep
        </span>
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
          className="mt-2 w-full border border-[var(--rule)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        disabled={busy || !prompt.trim()}
        className="bg-[var(--accent)] px-4 py-2 text-sm text-[var(--card)] disabled:opacity-50"
      >
        Save prompt
      </button>
      {status ? <p className="text-sm text-[var(--ink-soft)]">{status}</p> : null}
    </form>
  );
}
