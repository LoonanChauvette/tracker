# Tracker

A local browser app that follows scientific journals, scores new papers against **your analysis prompt**, and writes a structured monthly digest.

The MVP ships already tracking *[Ear and Hearing](https://journals.lww.com/ear-hearing)* (ISSN `0196-0202`), the official journal of the American Auditory Society.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then **AI setup** to connect a provider (OpenAI, Groq, OpenRouter, Ollama, or any OpenAI-compatible URL). Keys are stored in the local SQLite database and never sent back to the browser.

Optional: `CROSSREF_MAILTO` in `.env.local` puts Crossref requests in their polite pool.

| Screen | What it does |
| --- | --- |
| **Reports** | Past monthly digests |
| **Journals** | Search Crossref and add/remove ISSNs |
| **Prompt** | Edit the ranking brief and how many papers to keep |
| **AI setup** | Choose a provider, paste a key, test the connection |
| **Generate** | Fetch a month, score new DOIs, write the report |

Markdown download is available from each report.

## How scoring works

1. Crossref lists `journal-article` works for each tracked ISSN in the selected month (title, authors, abstract when deposited, DOI).
2. Papers not yet scored for the current prompt hash are sent to an OpenAI-compatible model as JSON.
3. Top *N* by score (then recency) are synthesized into themes and an intro.
4. SQLite at `data/tracker.db` keeps journals, papers, scores, reports, and AI settings. Re-runs skip already-scored DOIs.

## Tests

```bash
npm test
```

Crossref and the LLM are mocked. The pipeline fixture is a small *Ear and Hearing* month.
