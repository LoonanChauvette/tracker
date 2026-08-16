import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const journals = sqliteTable("journals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issn: text("issn").notNull().unique(),
  title: text("title").notNull(),
  publisher: text("publisher"),
  createdAt: text("created_at").notNull(),
});

export const papers = sqliteTable("papers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  doi: text("doi").notNull().unique(),
  journalId: integer("journal_id")
    .notNull()
    .references(() => journals.id),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  abstract: text("abstract"),
  publishedDate: text("published_date"),
  url: text("url"),
  month: text("month").notNull(),
});

export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paperId: integer("paper_id")
    .notNull()
    .references(() => papers.id),
  promptHash: text("prompt_hash").notNull(),
  score: real("score").notNull(),
  reason: text("reason").notNull(),
  summary: text("summary").notNull(),
  createdAt: text("created_at").notNull(),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  month: text("month").notNull().unique(),
  promptHash: text("prompt_hash").notNull(),
  model: text("model").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
