import { describe, expect, it } from "vitest";
import { formatTokenCount } from "@/lib/format";
import { mergeModelLists, recordAiUsage, getAiUsage } from "@/lib/ai-settings";
import { openDatabase } from "@/lib/db";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("formatTokenCount", () => {
  it("compacts large counts", () => {
    expect(formatTokenCount(12)).toBe("12");
    expect(formatTokenCount(12400)).toBe("12k");
    expect(formatTokenCount(1500)).toBe("1.5k");
  });
});

describe("usage and models", () => {
  it("records cumulative token usage", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracker-usage-"));
    const db = openDatabase(path.join(dir, "tracker.db"));
    recordAiUsage(db, { prompt_tokens: 100, completion_tokens: 20 });
    recordAiUsage(db, { prompt_tokens: 50, completion_tokens: 10 });
    expect(getAiUsage(db)).toMatchObject({
      promptTokens: 150,
      completionTokens: 30,
      requests: 2,
    });
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("merges fetched models with provider defaults", () => {
    const list = mergeModelLists(
      ["gpt-4.1-mini", "text-embedding-3-large", "gpt-4o"],
      "openai",
      "gpt-4.1",
    );
    expect(list).toContain("gpt-4.1-mini");
    expect(list).toContain("gpt-4o");
    expect(list).toContain("gpt-4.1");
    expect(list.some((id) => id.includes("embedding"))).toBe(false);
  });
});
