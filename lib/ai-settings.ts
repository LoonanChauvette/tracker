import { eq } from "drizzle-orm";
import {
  AI_PROVIDERS,
  isProviderId,
  type ProviderId,
} from "./ai-providers";
import type { TrackerDb } from "./db";
import { settings } from "./schema";

export type AiConfig = {
  provider: ProviderId;
  model: string;
  apiKey: string;
  baseURL?: string;
  source: "ui" | "env";
};

export type AiPublicState = {
  configured: boolean;
  provider: ProviderId;
  model: string;
  baseUrl: string;
  apiKeySet: boolean;
  apiKeyHint: string | null;
  source: "ui" | "env" | "none";
};

export type AiSettingsInput = {
  provider: ProviderId;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  clearKey?: boolean;
};

function getSetting(db: TrackerDb, key: string): string | null {
  return (
    db.select().from(settings).where(eq(settings.key, key)).get()?.value ?? null
  );
}

function setSetting(db: TrackerDb, key: string, value: string) {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    })
    .run();
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}

export function explainAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key")
  ) {
    return "The API key was rejected. Double-check it, or create a new one from the provider’s dashboard.";
  }
  if (lower.includes("429") || lower.includes("rate limit")) {
    return "The provider is rate-limiting this key. Wait a minute and try again.";
  }
  if (
    (lower.includes("404") || lower.includes("not found")) &&
    lower.includes("model")
  ) {
    return "That model name was not found on this provider. Try one of the suggested models.";
  }
  if (
    lower.includes("econnrefused") ||
    lower.includes("fetch failed") ||
    lower.includes("enotfound") ||
    lower.includes("connection")
  ) {
    return "Could not reach the AI server. Check the base URL, or start Ollama if you are running locally.";
  }
  return message;
}

function usable(config: {
  provider: ProviderId;
  model: string;
  apiKey: string;
}): boolean {
  const provider = AI_PROVIDERS[config.provider];
  if (!config.model.trim()) return false;
  if (provider.needsKey && !config.apiKey.trim()) return false;
  return true;
}

function readUiConfig(db: TrackerDb): AiConfig | null {
  const providerRaw = getSetting(db, "ai_provider");
  if (!providerRaw || !isProviderId(providerRaw)) return null;
  const provider = AI_PROVIDERS[providerRaw];
  const model =
    getSetting(db, "ai_model")?.trim() || provider.defaultModel;
  const storedKey = getSetting(db, "ai_api_key")?.trim() || "";
  const apiKey = storedKey || (provider.needsKey ? "" : "ollama");
  const storedBase = getSetting(db, "ai_base_url")?.trim();
  const baseURL = storedBase || provider.defaultBaseUrl || undefined;
  return {
    provider: providerRaw,
    model,
    apiKey,
    baseURL,
    source: "ui",
  };
}

function readEnvConfig(): AiConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
  return {
    provider: baseURL ? "custom" : "openai",
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    apiKey,
    baseURL,
    source: "env",
  };
}

export function resolveAiConfig(db: TrackerDb): AiConfig {
  const ui = readUiConfig(db);
  if (ui && usable(ui)) return ui;
  const env = readEnvConfig();
  if (env && usable(env)) return env;
  throw new Error("AI is not set up yet. Open Setup and connect a provider.");
}

export function getAiPublicState(db: TrackerDb): AiPublicState {
  const ui = readUiConfig(db);
  if (ui) {
    const storedKey = getSetting(db, "ai_api_key")?.trim() || "";
    return {
      configured: usable(ui),
      provider: ui.provider,
      model: ui.model,
      baseUrl: ui.baseURL ?? "",
      apiKeySet: Boolean(storedKey) || !AI_PROVIDERS[ui.provider].needsKey,
      apiKeyHint: storedKey ? maskApiKey(storedKey) : null,
      source: "ui",
    };
  }
  const env = readEnvConfig();
  if (env) {
    return {
      configured: true,
      provider: env.provider,
      model: env.model,
      baseUrl: env.baseURL ?? "",
      apiKeySet: true,
      apiKeyHint: maskApiKey(env.apiKey),
      source: "env",
    };
  }
  return {
    configured: false,
    provider: "openai",
    model: AI_PROVIDERS.openai.defaultModel,
    baseUrl: "",
    apiKeySet: false,
    apiKeyHint: null,
    source: "none",
  };
}

export function saveAiSettings(db: TrackerDb, input: AiSettingsInput) {
  const provider = AI_PROVIDERS[input.provider];
  const model = input.model.trim();
  if (!model) {
    throw new Error("Choose a model name.");
  }

  const existing = readUiConfig(db);
  const existingKey = getSetting(db, "ai_api_key")?.trim() || "";
  let nextKey = existingKey;

  if (input.clearKey) {
    nextKey = "";
  } else if (input.apiKey?.trim()) {
    nextKey = input.apiKey.trim();
  } else if (existing && existing.provider !== input.provider) {
    nextKey = "";
  }

  if (provider.needsKey && !nextKey) {
    throw new Error("Paste an API key to connect this provider.");
  }

  const baseUrl = provider.baseUrlEditable
    ? (input.baseUrl?.trim() || provider.defaultBaseUrl || "")
    : (provider.defaultBaseUrl || "");

  setSetting(db, "ai_provider", input.provider);
  setSetting(db, "ai_model", model);
  setSetting(db, "ai_base_url", baseUrl);
  setSetting(db, "ai_api_key", nextKey);
}

export async function testAiConnection(
  config: Pick<AiConfig, "apiKey" | "baseURL" | "model">,
  complete: typeof defaultTestComplete = defaultTestComplete,
): Promise<string> {
  if (!config.model.trim()) {
    throw new Error("Choose a model name first.");
  }
  if (!config.apiKey.trim()) {
    throw new Error("Paste an API key first.");
  }
  return complete(config);
}

async function defaultTestComplete(
  config: Pick<AiConfig, "apiKey" | "baseURL" | "model">,
): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const completion = await client.chat.completions.create({
    model: config.model,
    max_tokens: 8,
    messages: [{ role: "user", content: "Reply with the single word pong." }],
  });
  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("The model connected but returned an empty reply.");
  }
  return content;
}
