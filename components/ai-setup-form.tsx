"use client";

import { AI_PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/ai-providers";
import type { AiPublicState, AiRemoteUsage } from "@/lib/ai-settings";
import { formatTokenCount } from "@/lib/format";
import { useMemo, useState } from "react";

export function AiSetupForm({ initial }: { initial: AiPublicState }) {
  const [state, setState] = useState(initial);
  const [provider, setProvider] = useState<ProviderId>(initial.provider);
  const [model, setModel] = useState(initial.model);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState(initial.models);
  const [busy, setBusy] = useState<"save" | "test" | "models" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spec = AI_PROVIDERS[provider];
  const modelOptions = useMemo(() => {
    const extra = model && !models.includes(model) ? [model] : [];
    return [...new Set([...spec.models, ...models, ...extra])];
  }, [models, model, spec.models]);

  function selectProvider(next: ProviderId) {
    const nextSpec = AI_PROVIDERS[next];
    setProvider(next);
    setApiKey("");
    setShowKey(false);
    setModel(nextSpec.defaultModel);
    setBaseUrl(nextSpec.defaultBaseUrl ?? "");
    setModels(nextSpec.models);
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
      applyState(data);
      setApiKey("");
      setStatus("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  function applyState(data: AiPublicState) {
    setState(data);
    setProvider(data.provider);
    setModel(data.model);
    setBaseUrl(data.baseUrl);
    setModels(data.models);
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
      await refreshModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setBusy(null);
    }
  }

  async function refreshModels() {
    setBusy("models");
    try {
      const response = await fetch("/api/ai/models");
      const data = (await response.json()) as { models?: string[]; error?: string };
      if (response.ok && data.models) setModels(data.models);
    } catch {
      // Keep the local list if the provider does not expose /models.
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Provider" value={state.configured ? AI_PROVIDERS[state.provider].label : "Not connected"} />
        <Stat label="Model" value={state.configured ? state.model : "—"} />
        <Stat
          label="Usage"
          value={
            state.configured
              ? `${formatTokenCount(state.usage.promptTokens + state.usage.completionTokens)} tokens`
              : "—"
          }
          hint={
            state.usage.requests
              ? `${state.usage.requests} calls · ${formatTokenCount(state.usage.promptTokens)} in / ${formatTokenCount(state.usage.completionTokens)} out`
              : "Counted from this app"
          }
        />
      </div>
      {state.remote ? <RemoteBar remote={state.remote} /> : null}

      <form onSubmit={save} className="panel p-5">
        <div className="flex gap-1 overflow-x-auto pb-4">
          {PROVIDER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => selectProvider(id)}
              className={`rounded-full px-3 py-1.5 text-[13px] ${
                provider === id
                  ? "bg-[var(--text)] text-white"
                  : "bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {AI_PROVIDERS[id].label}
            </button>
          ))}
        </div>

        <p className="mb-5 text-sm text-[var(--muted)]">{spec.blurb}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {spec.needsKey ? (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--muted)]">API key</span>
              <div className="flex gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  autoComplete="off"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={
                    state.apiKeyHint
                      ? `Saved ${state.apiKeyHint}`
                      : "Paste key — stored only on this machine"
                  }
                  className="field"
                />
                <button type="button" onClick={() => setShowKey((value) => !value)} className="btn btn-ghost">
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              {spec.docsUrl ? (
                <a href={spec.docsUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-xs text-[var(--muted)] hover:text-[var(--text)]">
                  {spec.docsLabel}
                </a>
              ) : null}
            </label>
          ) : (
            <p className="sm:col-span-2 text-sm text-[var(--muted)]">
              No cloud key. Start Ollama locally, then test.
            </p>
          )}

          <label className="block sm:col-span-2">
            <span className="mb-1.5 flex items-center justify-between text-xs text-[var(--muted)]">
              Model
              <button
                type="button"
                onClick={() => void refreshModels()}
                disabled={Boolean(busy)}
                className="text-[var(--text)]"
              >
                {busy === "models" ? "Loading…" : "Refresh from provider"}
              </button>
            </span>
            <input
              list="provider-models"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="field"
              placeholder={spec.defaultModel || "model-id"}
            />
            <datalist id="provider-models">
              {modelOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          {spec.baseUrlEditable ? (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--muted)]">Base URL</span>
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                className="field"
                placeholder={spec.defaultBaseUrl || "https://…/v1"}
              />
            </label>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="submit" disabled={Boolean(busy)} className="btn btn-primary">
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={test} disabled={Boolean(busy)} className="btn btn-ghost">
            {busy === "test" ? "Testing…" : "Test"}
          </button>
        </div>
        {status ? <p className="mt-3 text-sm text-[var(--ok)]">{status}</p> : null}
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      </form>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel px-4 py-3">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function RemoteBar({ remote }: { remote: AiRemoteUsage }) {
  const percent =
    remote.limit && remote.limit > 0 ? Math.min(100, (remote.used / remote.limit) * 100) : null;
  return (
    <div className="panel px-4 py-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{remote.label}</span>
        <span className="text-[var(--muted)]">
          {remote.unit === "usd" ? `$${remote.used.toFixed(2)}` : remote.used}
          {remote.limit != null
            ? ` / ${remote.unit === "usd" ? `$${remote.limit.toFixed(2)}` : remote.limit}`
            : ""}
        </span>
      </div>
      {percent != null ? (
        <div className="mt-2 h-1 rounded-full bg-[var(--bg)]">
          <div className="h-1 rounded-full bg-[var(--text)]" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}
