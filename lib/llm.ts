import { z } from "zod";
import { resolveAiConfig } from "./ai-settings";
import { getDb } from "./db";

export const PaperScoreSchema = z.object({
  doi: z.string(),
  score: z.number().min(0).max(100),
  reason: z.string(),
  summary: z.string(),
});

export const ScoreBatchSchema = z.object({
  scores: z.array(PaperScoreSchema),
});

export const SynthesisSchema = z.object({
  intro: z.string(),
  themes: z.array(z.string()).min(1).max(8),
});

export type PaperScore = z.infer<typeof PaperScoreSchema>;
export type Synthesis = z.infer<typeof SynthesisSchema>;

export type ScoreablePaper = {
  doi: string;
  title: string;
  authors: string;
  abstract: string | null;
  journalTitle: string;
};

export type RankedPaperInput = ScoreablePaper & {
  score: number;
  reason: string;
  summary: string;
  publishedDate: string | null;
  url: string;
};

export function getModelName(): string {
  return resolveAiConfig(getDb()).model;
}

async function completeJson<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
): Promise<T> {
  const config = resolveAiConfig(getDb());
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const completion = await client.chat.completions.create({
    model: config.model,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("The model returned an empty response.");
  }
  return schema.parse(JSON.parse(content));
}

export async function scorePapers(
  papers: ScoreablePaper[],
  analysisPrompt: string,
): Promise<PaperScore[]> {
  const results: PaperScore[] = [];
  const batchSize = 8;

  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);
    const parsed = await completeJson(
      ScoreBatchSchema,
      `You score scientific papers for a monthly reading list. ${analysisPrompt}

Return JSON: {"scores":[{"doi":"...","score":0-100,"reason":"one or two sentences","summary":"two sentences on findings/methods"}]}.
Score every paper in the batch. Use the given DOI values exactly.`,
      JSON.stringify(
        batch.map((paper) => ({
          doi: paper.doi,
          title: paper.title,
          authors: paper.authors,
          journal: paper.journalTitle,
          abstract: paper.abstract || "(no abstract)",
        })),
      ),
    );

    const byDoi = new Map(parsed.scores.map((score) => [score.doi, score]));
    for (const paper of batch) {
      const hit = byDoi.get(paper.doi);
      results.push(
        hit ?? {
          doi: paper.doi,
          score: 0,
          reason: "The model did not return a score for this paper.",
          summary: paper.abstract?.slice(0, 280) || "No abstract available.",
        },
      );
    }
  }

  return results;
}

export async function synthesizeReport(
  monthLabel: string,
  analysisPrompt: string,
  papers: RankedPaperInput[],
): Promise<Synthesis> {
  if (!papers.length) {
    return {
      intro: `No articles matched the tracked journals for ${monthLabel}.`,
      themes: ["No papers this period"],
    };
  }

  return completeJson(
    SynthesisSchema,
    `You write a short structured monthly digest. ${analysisPrompt}

Return JSON: {"intro":"1-2 paragraphs","themes":["3-6 short theme labels"]}.
Base the themes only on the ranked papers provided.`,
    JSON.stringify({
      month: monthLabel,
      papers: papers.map((paper) => ({
        title: paper.title,
        score: paper.score,
        reason: paper.reason,
        summary: paper.summary,
      })),
    }),
  );
}
