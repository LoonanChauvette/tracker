# Tracker

A local app that follows scientific journals, scores new papers against **your analysis prompt**, and writes a structured monthly digest.

The MVP ships already tracking *[Ear and Hearing](https://journals.lww.com/ear-hearing)* (ISSN `0196-0202`).

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the sidebar: Reports, Generate, Journals, Prompt, Model.

On **Model**, pick a provider (OpenAI, Groq, OpenRouter, Ollama, or custom), paste a key, and test. Usage and the active model stay visible in the sidebar. Keys never leave this machine.

Journals use live autocomplete against Crossref.

Optional: `CROSSREF_MAILTO` in `.env.local` puts Crossref requests in their polite pool.

## Tests

```bash
npm test
```
