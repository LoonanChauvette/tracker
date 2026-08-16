export const PROVIDER_IDS = [
  "openai",
  "groq",
  "openrouter",
  "ollama",
  "custom",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type AiProvider = {
  id: ProviderId;
  label: string;
  blurb: string;
  docsUrl: string | null;
  docsLabel: string | null;
  defaultModel: string;
  models: string[];
  defaultBaseUrl: string | null;
  needsKey: boolean;
  baseUrlEditable: boolean;
};

export const AI_PROVIDERS: Record<ProviderId, AiProvider> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    blurb: "ChatGPT models. The usual starting point.",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "Get an API key",
    defaultModel: "gpt-4.1-mini",
    models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o"],
    defaultBaseUrl: null,
    needsKey: true,
    baseUrlEditable: false,
  },
  groq: {
    id: "groq",
    label: "Groq",
    blurb: "Very fast, usually inexpensive. Good for monthly batches.",
    docsUrl: "https://console.groq.com/keys",
    docsLabel: "Get a Groq key",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    baseUrlEditable: false,
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    blurb: "One key for many labs (OpenAI, Anthropic, open weights).",
    docsUrl: "https://openrouter.ai/keys",
    docsLabel: "Get an OpenRouter key",
    defaultModel: "openai/gpt-4.1-mini",
    models: [
      "openai/gpt-4.1-mini",
      "anthropic/claude-sonnet-4",
      "google/gemini-2.5-flash",
    ],
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    baseUrlEditable: false,
  },
  ollama: {
    id: "ollama",
    label: "Ollama",
    blurb: "Run a model on this machine. No cloud key required.",
    docsUrl: "https://ollama.com/download",
    docsLabel: "Install Ollama",
    defaultModel: "llama3.1",
    models: ["llama3.1", "mistral", "qwen2.5"],
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    needsKey: false,
    baseUrlEditable: true,
  },
  custom: {
    id: "custom",
    label: "Custom",
    blurb: "Any OpenAI-compatible server. You paste the URL and model name.",
    docsUrl: null,
    docsLabel: null,
    defaultModel: "",
    models: [],
    defaultBaseUrl: "",
    needsKey: true,
    baseUrlEditable: true,
  },
};

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}
