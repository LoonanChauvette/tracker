import { and, desc, eq } from "drizzle-orm";
import { fetchMonthWorks, getJournal, type CrossrefWork } from "./crossref";
import { monthLabel } from "./dates";
import { sha256 } from "./hash";
import { resolveAiConfig } from "./ai-settings";
import { getDb } from "./db";
import {
  scorePapers,
  synthesizeReport,
  type RankedPaperInput,
} from "./llm";
import { journals, papers, reports, scores, settings } from "./schema";
import type { TrackerDb } from "./db";
import { doiUrl } from "./text";
import type { ProgressEvent, ReportPayload } from "./types";

export type GenerateDeps = {
  fetchMonthWorks: (
    issn: string,
    month: string,
  ) => Promise<CrossrefWork[]>;
  scorePapers: typeof scorePapers;
  synthesizeReport: typeof synthesizeReport;
  getModelName: () => string;
};

export const defaultGenerateDeps: GenerateDeps = {
  fetchMonthWorks,
  scorePapers,
  synthesizeReport,
  getModelName: () => resolveAiConfig(getDb()).model,
};

export function getPrompt(db: TrackerDb): string {
  return (
    db.select().from(settings).where(eq(settings.key, "analysis_prompt")).get()
      ?.value ?? ""
  );
}

export function getTopN(db: TrackerDb): number {
  const raw = db
    .select()
    .from(settings)
    .where(eq(settings.key, "top_n"))
    .get()?.value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

export function setPrompt(db: TrackerDb, value: string) {
  db.insert(settings)
    .values({ key: "analysis_prompt", value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    })
    .run();
}

export function listJournals(db: TrackerDb) {
  return db.select().from(journals).all();
}

export async function addJournalByIssn(
  db: TrackerDb,
  issn: string,
  lookup = getJournal,
) {
  const journal = await lookup(issn);
  if (!journal) {
    throw new Error(`No Crossref journal found for ISSN ${issn}.`);
  }
  db.insert(journals)
    .values({
      issn: journal.issn,
      title: journal.title,
      publisher: journal.publisher,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing()
    .run();
  return journal;
}

export function removeJournal(db: TrackerDb, id: number) {
  const journalPapers = db.select().from(papers).where(eq(papers.journalId, id)).all();
  for (const paper of journalPapers) {
    db.delete(scores).where(eq(scores.paperId, paper.id)).run();
  }
  db.delete(papers).where(eq(papers.journalId, id)).run();
  db.delete(journals).where(eq(journals.id, id)).run();
}

export function listReports(db: TrackerDb) {
  return db.select().from(reports).orderBy(desc(reports.month)).all();
}

export function getReport(db: TrackerDb, month: string): ReportPayload | null {
  const row = db.select().from(reports).where(eq(reports.month, month)).get();
  if (!row) return null;
  return JSON.parse(row.payloadJson) as ReportPayload;
}

export function rankPapers<T extends { score: number; publishedDate: string | null }>(
  items: T[],
  topN: number,
): T[] {
  return [...items]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.publishedDate ?? "").localeCompare(a.publishedDate ?? "");
    })
    .slice(0, topN);
}

export async function generateMonth(
  db: TrackerDb,
  month: string,
  onProgress: (event: ProgressEvent) => void = () => undefined,
  deps: GenerateDeps = defaultGenerateDeps,
): Promise<ReportPayload> {
  const tracked = listJournals(db);
  if (!tracked.length) {
    throw new Error("Add at least one journal before generating a report.");
  }

  const analysisPrompt = getPrompt(db);
  const promptHash = sha256(analysisPrompt.trim());
  const topN = getTopN(db);
  const label = monthLabel(month);

  onProgress({
    stage: "fetch",
    message: `Fetching ${tracked.length} journal${tracked.length === 1 ? "" : "s"} for ${label}…`,
    progress: 0.05,
  });

  for (const [index, journal] of tracked.entries()) {
    onProgress({
      stage: "fetch",
      message: `Fetching ${journal.title}…`,
      progress: 0.05 + (index / Math.max(tracked.length, 1)) * 0.35,
    });
    const works = await deps.fetchMonthWorks(journal.issn, month);
    for (const work of works) {
      db.insert(papers)
        .values({
          doi: work.doi,
          journalId: journal.id,
          title: work.title,
          authors: work.authors,
          abstract: work.abstract,
          publishedDate: work.publishedDate,
          url: work.url,
          month,
        })
        .onConflictDoUpdate({
          target: papers.doi,
          set: {
            title: work.title,
            authors: work.authors,
            abstract: work.abstract,
            publishedDate: work.publishedDate,
            url: work.url,
            month,
            journalId: journal.id,
          },
        })
        .run();
    }
  }

  const monthPapers = db
    .select({
      id: papers.id,
      doi: papers.doi,
      title: papers.title,
      authors: papers.authors,
      abstract: papers.abstract,
      publishedDate: papers.publishedDate,
      url: papers.url,
      journalTitle: journals.title,
    })
    .from(papers)
    .innerJoin(journals, eq(papers.journalId, journals.id))
    .where(eq(papers.month, month))
    .all();

  const unscored = monthPapers.filter((paper) => {
    const existing = db
      .select()
      .from(scores)
      .where(and(eq(scores.paperId, paper.id), eq(scores.promptHash, promptHash)))
      .get();
    return !existing;
  });

  onProgress({
    stage: "score",
    message:
      unscored.length > 0
        ? `Scoring ${unscored.length} new paper${unscored.length === 1 ? "" : "s"}…`
        : "Using stored scores for this prompt…",
    progress: 0.45,
  });

  if (unscored.length) {
    const scored = await deps.scorePapers(
      unscored.map((paper) => ({
        doi: paper.doi,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        journalTitle: paper.journalTitle,
      })),
      analysisPrompt,
    );
    const now = new Date().toISOString();
    for (const paper of unscored) {
      const hit = scored.find((item) => item.doi === paper.doi);
      db.insert(scores)
        .values({
          paperId: paper.id,
          promptHash,
          score: hit?.score ?? 0,
          reason: hit?.reason ?? "No score returned.",
          summary: hit?.summary ?? (paper.abstract?.slice(0, 280) || "No abstract."),
          createdAt: now,
        })
        .run();
    }
  }

  const scoredPapers: RankedPaperInput[] = monthPapers.map((paper) => {
    const score = db
      .select()
      .from(scores)
      .where(and(eq(scores.paperId, paper.id), eq(scores.promptHash, promptHash)))
      .get();
    return {
      doi: paper.doi,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      journalTitle: paper.journalTitle,
      publishedDate: paper.publishedDate,
      url: paper.url || doiUrl(paper.doi),
      score: score?.score ?? 0,
      reason: score?.reason ?? "Unscored",
      summary: score?.summary ?? "",
    };
  });

  const ranked = rankPapers(scoredPapers, topN);

  onProgress({
    stage: "synthesize",
    message: "Writing the monthly digest…",
    progress: 0.85,
  });

  const synthesis = await deps.synthesizeReport(label, analysisPrompt, ranked);
  const payload: ReportPayload = {
    month,
    monthLabel: label,
    journals: tracked.map((journal) => ({
      title: journal.title,
      issn: journal.issn,
    })),
    candidateCount: monthPapers.length,
    topN,
    intro: synthesis.intro,
    themes: synthesis.themes,
    papers: ranked.map((paper) => ({
      doi: paper.doi,
      title: paper.title,
      authors: paper.authors,
      journalTitle: paper.journalTitle,
      publishedDate: paper.publishedDate,
      url: paper.url,
      score: paper.score,
      reason: paper.reason,
      summary: paper.summary,
    })),
    model: deps.getModelName(),
    promptHash,
  };

  db.insert(reports)
    .values({
      month,
      promptHash,
      model: payload.model,
      payloadJson: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: reports.month,
      set: {
        promptHash,
        model: payload.model,
        payloadJson: JSON.stringify(payload),
        createdAt: new Date().toISOString(),
      },
    })
    .run();

  onProgress({
    stage: "done",
    message: "Report ready.",
    progress: 1,
    month,
  });

  return payload;
}
