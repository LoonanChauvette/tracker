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
      <div className="panel flex items-center justify-between gap-4 px-4 py-4">
        <p className="text-sm text-[var(--muted)]">Connect a model first.</p>
        <Link href="/setup" className="btn btn-primary">
          Model
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
    <form onSubmit={generate} className="panel max-w-md p-5">
      <label className="block">
        <span className="mb-1.5 block text-xs text-[var(--muted)]">Month</span>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="field"
        />
      </label>
      <button type="submit" disabled={busy} className="btn btn-primary mt-4">
        {busy ? "Working…" : "Generate"}
      </button>

      {latest ? (
        <div className="mt-5">
          <div className="h-1 rounded-full bg-[var(--bg)]">
            <div
              className="h-1 rounded-full bg-[var(--text)] transition-all"
              style={{ width: `${Math.round(latest.progress * 100)}%` }}
            />
          </div>
          <ol className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            {log.map((item, index) => (
              <li key={`${item.message}-${index}`}>{item.message}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
    </form>
  );
}
