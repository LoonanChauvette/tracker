export type ReportPaper = {
  doi: string;
  title: string;
  authors: string;
  journalTitle: string;
  publishedDate: string | null;
  url: string;
  score: number;
  reason: string;
  summary: string;
};

export type ReportPayload = {
  month: string;
  monthLabel: string;
  journals: Array<{ title: string; issn: string }>;
  candidateCount: number;
  topN: number;
  intro: string;
  themes: string[];
  papers: ReportPaper[];
  model: string;
  promptHash: string;
};

export type ProgressEvent = {
  stage: "fetch" | "score" | "synthesize" | "done" | "error";
  message: string;
  progress: number;
  month?: string;
};
