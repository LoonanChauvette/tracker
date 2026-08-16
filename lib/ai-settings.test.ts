import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  explainAiError,
  getAiPublicState,
  maskApiKey,
  resolveAiConfig,
  saveAiSettings,
  testAiConnection,
} from "@/lib/ai-settings";
import { openDatabase, type TrackerDb } from "@/lib/db";

function tempDb(): { db: TrackerDb; dir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracker-ai-"));
  return { db: openDatabase(path.join(dir, "tracker.db")), dir };
}

describe("AI settings", () => {
  const dirs: string[] = [];
  const originalEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  };

  afterEach(() => {
    for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
    dirs.length = 0;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("masks keys and never puts the secret in public state", () => {
    expect(maskApiKey("sk-test-1234abcd")).toBe("••••abcd");
    delete process.env.OPENAI_API_KEY;
    const { db, dir } = tempDb();
    dirs.push(dir);
    saveAiSettings(db, {
      provider: "openai",
      model: "gpt-4.1-mini",
      apiKey: "sk-secret-key-9999",
    });
    const publicState = getAiPublicState(db);
    expect(publicState.configured).toBe(true);
    expect(publicState.apiKeyHint).toBe("••••9999");
    expect(JSON.stringify(publicState)).not.toContain("sk-secret-key-9999");
    expect(resolveAiConfig(db).apiKey).toBe("sk-secret-key-9999");
  });

  it("falls back to environment variables until the UI is saved", () => {
    process.env.OPENAI_API_KEY = "sk-env-key-4242";
    process.env.OPENAI_MODEL = "gpt-4o-mini";
    delete process.env.OPENAI_BASE_URL;
    const { db, dir } = tempDb();
    dirs.push(dir);
    const state = getAiPublicState(db);
    expect(state.source).toBe("env");
    expect(state.model).toBe("gpt-4o-mini");
    expect(resolveAiConfig(db).source).toBe("env");
  });

  it("lets UI settings override the environment", () => {
    process.env.OPENAI_API_KEY = "sk-env-key-4242";
    const { db, dir } = tempDb();
    dirs.push(dir);
    saveAiSettings(db, {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "gsk-ui-key-1111",
    });
    const config = resolveAiConfig(db);
    expect(config.source).toBe("ui");
    expect(config.provider).toBe("groq");
    expect(config.baseURL).toBe("https://api.groq.com/openai/v1");
    expect(config.apiKey).toBe("gsk-ui-key-1111");
  });

  it("does not require a cloud key for Ollama", () => {
    delete process.env.OPENAI_API_KEY;
    const { db, dir } = tempDb();
    dirs.push(dir);
    saveAiSettings(db, {
      provider: "ollama",
      model: "llama3.1",
    });
    const config = resolveAiConfig(db);
    expect(getAiPublicState(db).configured).toBe(true);
    expect(config.apiKey).toBe("ollama");
  });

  it("explains auth failures without raw provider jargon", () => {
    expect(explainAiError(new Error("401 Incorrect API key provided"))).toMatch(
      /API key was rejected/,
    );
  });

  it("tests a connection through an injected completer", async () => {
    const reply = await testAiConnection(
      { apiKey: "sk-test", model: "gpt-4.1-mini" },
      async () => "pong",
    );
    expect(reply).toBe("pong");
  });
});
