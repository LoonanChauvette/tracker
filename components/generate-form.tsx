"use client";

import { lastCalendarMonth } from "@/lib/dates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProgressEvent = {
  stage: string;
  message: string;
  progress: number;
  month?: string;
};

export function GenerateForm({ aiReady }: { aiReady: boolean }) {
  const router = useRouter();
  const defaultMonth = useMemo(() => lastCalendarMonth(), []);
  const [month, setMonth] = useState(defaultMonth);
  const [log, setLog] = useState<ProgressEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = log.at(-1);

  if (!aiReady) {
    return (
      <div className="border border-[var(--rule)] bg-[var(--card)] p-5">
        <p className="font-[var(--font-display)] text-2xl">AI is not connected</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Connect a provider before generating a digest. It takes a key and a model name.
        </p>
        <Link
          href="/setup"
          className="mt-4 inline-block bg-[var(--accent)] px-4 py-2 text-sm text-[var(--card)]"
        >
          Set up AI
        </Link>
      </div>
    );
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setLog([]);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });

      if (!response.body) {
        throw new Error("No progress stream from the server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneMonth: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as ProgressEvent & { error?: string };
          if (event.stage === "error") {
            throw new Error(event.error || event.message);
          }
          setLog((current) => [...current, event]);
          if (event.stage === "done" && event.month) {
            doneMonth = event.month;
          }
        }
      }

      if (!response.ok) {
        throw new Error("Generate failed.");
      }
      if (doneMonth) {
        router.push(`/reports/${doneMonth}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={generate} className="space-y-8">
      <label className="block max-w-xs">
        <span className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
          Month
        </span>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="mt-2 w-full border border-[var(--rule)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="bg-[var(--accent)] px-4 py-2 text-sm text-[var(--card)] disabled:opacity-50"
      >
        {busy ? "Working…" : "Fetch, score, and write report"}
      </button>

      {latest ? (
        <div>
          <div className="h-1 bg-[var(--paper-deep)]">
            <div
              className="h-1 bg-[var(--accent)] transition-all"
              style={{ width: `${Math.round(latest.progress * 100)}%` }}
            />
          </div>
          <ol className="mt-4 space-y-1 text-sm text-[var(--ink-soft)]">
            {log.map((item, index) => (
              <li key={`${item.message}-${index}`}>{item.message}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
    </form>
  );
}
