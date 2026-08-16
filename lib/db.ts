import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { journals, papers, reports, scores, settings } from "./schema";
import { DEFAULT_PROMPT, DEFAULT_TOP_N, EAR_AND_HEARING } from "./seed";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issn TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  publisher TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS papers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doi TEXT NOT NULL UNIQUE,
  journal_id INTEGER NOT NULL REFERENCES journals(id),
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  abstract TEXT,
  published_date TEXT,
  url TEXT,
  month TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id INTEGER NOT NULL REFERENCES papers(id),
  prompt_hash TEXT NOT NULL,
  score REAL NOT NULL,
  reason TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS scores_paper_prompt ON scores (paper_id, prompt_hash);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL UNIQUE,
  prompt_hash TEXT NOT NULL,
  model TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export type TrackerDb = BetterSQLite3Database<{
  journals: typeof journals;
  papers: typeof papers;
  reports: typeof reports;
  scores: typeof scores;
  settings: typeof settings;
}>;

const schema = { journals, papers, reports, scores, settings };

export function defaultDbPath(): string {
  return path.join(process.cwd(), "data", "tracker.db");
}

export function openDatabase(dbPath = defaultDbPath()): TrackerDb {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(SCHEMA_SQL);
  const db = drizzle(sqlite, { schema });
  seed(db);
  return db;
}

function seed(db: TrackerDb) {
  const existing = db
    .select()
    .from(journals)
    .where(eq(journals.issn, EAR_AND_HEARING.issn))
    .all();
  if (!existing.length) {
    db.insert(journals)
      .values({
        issn: EAR_AND_HEARING.issn,
        title: EAR_AND_HEARING.title,
        publisher: EAR_AND_HEARING.publisher,
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  const prompt = db
    .select()
    .from(settings)
    .where(eq(settings.key, "analysis_prompt"))
    .get();
  if (!prompt) {
    db.insert(settings)
      .values({ key: "analysis_prompt", value: DEFAULT_PROMPT })
      .run();
  }

  const topN = db
    .select()
    .from(settings)
    .where(eq(settings.key, "top_n"))
    .get();
  if (!topN) {
    db.insert(settings)
      .values({ key: "top_n", value: String(DEFAULT_TOP_N) })
      .run();
  }
}

const globalForDb = globalThis as unknown as { trackerDb?: TrackerDb };

export function getDb(): TrackerDb {
  if (!globalForDb.trackerDb) {
    globalForDb.trackerDb = openDatabase();
  }
  return globalForDb.trackerDb;
}
