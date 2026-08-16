"use client";

import { AI_PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/ai-providers";
import type { AiPublicState } from "@/lib/ai-settings";
import { useMemo, useState } from "react";

export function AiSetupForm({ initial }: { initial: AiPublicState }) {
  const [provider, setProvider] = useState<ProviderId>(initial.provider);
  const [model, setModel] = useState(initial.model);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [status, setStatus] = useState<string | null>(
    initial.configured
      ? initial.source === "env"
        ? "Using keys from the server environment. Save here to manage them in the app instead."
        : `Ready · ${AI_PROVIDERS[initial.provider].label} · ${initial.model}`
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState(initial.apiKeyHint);

  const spec = AI_PROVIDERS[provider];
  const modelListId = useMemo(() => `models-${provider}`, [provider]);

  function selectProvider(next: ProviderId) {
    const nextSpec = AI_PROVIDERS[next];
    setProvider(next);
    setApiKey("");
    setShowKey(false);
    setModel((current) => {
      const previousModels = AI_PROVIDERS[provider].models;
      if (!current || previousModels.includes(current)) {
        return nextSpec.defaultModel;
      }
      return current;
    });
    setBaseUrl(nextSpec.defaultBaseUrl ?? "");
  }

  async function save(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy("save");
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey.trim() || undefined,
          baseUrl,
        }),
      });
      const data = (await response.json()) as AiPublicState & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save.");
      setHint(data.apiKeyHint);
      setApiKey("");
      setStatus(`Saved. Ready · ${AI_PROVIDERS[data.provider].label} · ${data.model}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey.trim() || undefined,
          baseUrl,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Connection failed.");
      setStatus(data.message ?? "Connected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={save} className="space-y-10">
      <fieldset>
        <legend className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
          Provider
        </legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PROVIDER_IDS.map((id) => {
            const item = AI_PROVIDERS[id];
            const selected = provider === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectProvider(id)}
                className={`border px-4 py-3 text-left ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--card)]"
                    : "border-[var(--rule)] hover:border-[var(--accent)]"
                }`}
              >
                <span className="block font-medium">{item.label}</span>
                <span className="mt-1 block text-sm text-[var(--ink-soft)]">{item.blurb}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-6 border border-[var(--rule)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-[var(--font-display)] text-2xl">{spec.label}</h2>
          {spec.docsUrl ? (
            <a
              href={spec.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--accent)]"
            >
              {spec.docsLabel} ↗
            </a>
          ) : null}
        </div>

        {spec.needsKey ? (
          <label className="block">
            <span className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
              API key
            </span>
            <div className="mt-2 flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={
                  hint
                    ? `Saved ${hint} — paste a new key to replace`
                    : "Paste your key. It stays on this machine."
                }
                className="flex-1 border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="border border-[var(--rule)] px-3 text-sm text-[var(--ink-soft)]"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </label>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">
            No cloud key. Start Ollama, pull a model, then test the connection.
          </p>
        )}

        <label className="block">
          <span className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            Model
          </span>
          <input
            list={modelListId}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={spec.defaultModel || "model-name"}
            className="mt-2 w-full border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 outline-none focus:border-[var(--accent)]"
          />
          <datalist id={modelListId}>
            {spec.models.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>

        {spec.baseUrlEditable ? (
          <label className="block">
            <span className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
              Base URL
            </span>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder={spec.defaultBaseUrl || "https://…/v1"}
              className="mt-2 w-full border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 outline-none focus:border-[var(--accent)]"
            />
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={Boolean(busy)}
          className="bg-[var(--accent)] px-4 py-2 text-sm text-[var(--card)] disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={test}
          disabled={Boolean(busy)}
          className="border border-[var(--rule)] px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy === "test" ? "Testing…" : "Test connection"}
        </button>
      </div>

      {status ? <p className="text-sm text-[var(--accent)]">{status}</p> : null}
      {error ? <p className="text-sm text-[var(--accent-2)]">{error}</p> : null}
    </form>
  );
}
