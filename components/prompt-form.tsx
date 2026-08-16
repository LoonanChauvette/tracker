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
      setStatus("Saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={14}
        className="field min-h-64 leading-6"
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="w-36">
          <span className="mb-1.5 block text-xs text-[var(--muted)]">Top papers</span>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="field"
          />
        </label>
        <button type="submit" disabled={busy || !prompt.trim()} className="btn btn-primary">
          {busy ? "Saving…" : "Save"}
        </button>
        {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      </div>
    </form>
  );
}
