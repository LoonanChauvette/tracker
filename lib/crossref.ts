import { monthRange } from "./dates";
import {
  formatAuthors,
  normalizeIssn,
  publishedDateFromParts,
  stripJats,
} from "./text";

const CROSSREF_BASE = "https://api.crossref.org";

export type CrossrefJournal = {
  issn: string;
  title: string;
  publisher: string | null;
};

export type CrossrefWork = {
  doi: string;
  title: string;
  authors: string;
  abstract: string | null;
  publishedDate: string | null;
  url: string;
  containerTitle: string | null;
};

type CrossrefJournalItem = {
  title?: string;
  publisher?: string;
  ISSN?: string[];
};

type CrossrefWorkItem = {
  DOI?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  abstract?: string;
  URL?: string;
  "container-title"?: string[];
  published?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
  "published-print"?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
};

function mailto(): string {
  return process.env.CROSSREF_MAILTO?.trim() || "tracker@localhost";
}

export async function crossrefGet<T>(
  path: string,
  params: Record<string, string> = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const url = new URL(path, CROSSREF_BASE);
  url.searchParams.set("mailto", mailto());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetchImpl(url, {
    headers: {
      "User-Agent": `tracker/0.1 (mailto:${mailto()})`,
    },
  });

  if (!response.ok) {
    throw new Error(`Crossref ${response.status} for ${url.pathname}`);
  }

  return (await response.json()) as T;
}

export async function searchJournals(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CrossrefJournal[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const issn = normalizeIssn(trimmed);
  if (issn) {
    const journal = await getJournal(issn, fetchImpl);
    return journal ? [journal] : [];
  }

  const data = await crossrefGet<{
    message?: { items?: CrossrefJournalItem[] };
  }>("/journals", { query: trimmed, rows: "8" }, fetchImpl);

  return (data.message?.items ?? [])
    .map(toJournal)
    .filter((item): item is CrossrefJournal => item !== null);
}

export async function getJournal(
  issn: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CrossrefJournal | null> {
  const normalized = normalizeIssn(issn);
  if (!normalized) return null;
  try {
    const data = await crossrefGet<{ message?: CrossrefJournalItem }>(
      `/journals/${normalized}`,
      {},
      fetchImpl,
    );
    return toJournal(data.message ?? {});
  } catch {
    return null;
  }
}

export async function fetchMonthWorks(
  issn: string,
  month: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CrossrefWork[]> {
  const { from, until } = monthRange(month);
  const works: CrossrefWork[] = [];
  let cursor = "*";

  for (let page = 0; page < 20; page += 1) {
    const data = await crossrefGet<{
      message?: {
        items?: CrossrefWorkItem[];
        "next-cursor"?: string;
      };
    }>(
      `/journals/${issn}/works`,
      {
        filter: `from-pub-date:${from},until-pub-date:${until},type:journal-article`,
        rows: "100",
        cursor,
        select:
          "DOI,title,author,abstract,URL,container-title,published,published-online,published-print,issued",
        sort: "published",
        order: "desc",
      },
      fetchImpl,
    );

    const items = data.message?.items ?? [];
    for (const item of items) {
      const work = toWork(item);
      if (work) works.push(work);
    }

    const next = data.message?.["next-cursor"];
    if (!items.length || !next || next === cursor) break;
    cursor = next;
  }

  const seen = new Set<string>();
  return works.filter((work) => {
    if (seen.has(work.doi)) return false;
    seen.add(work.doi);
    return true;
  });
}

function toJournal(item: CrossrefJournalItem): CrossrefJournal | null {
  const issn = item.ISSN?.map((value) => normalizeIssn(value)).find(Boolean);
  if (!issn || !item.title) return null;
  return {
    issn,
    title: item.title,
    publisher: item.publisher ?? null,
  };
}

function toWork(item: CrossrefWorkItem): CrossrefWork | null {
  const doi = item.DOI?.trim();
  const title = item.title?.[0]?.trim();
  if (!doi || !title) return null;
  return {
    doi,
    title,
    authors: formatAuthors(item.author),
    abstract: stripJats(item.abstract),
    publishedDate:
      publishedDateFromParts(item.published?.["date-parts"]) ??
      publishedDateFromParts(item["published-online"]?.["date-parts"]) ??
      publishedDateFromParts(item["published-print"]?.["date-parts"]) ??
      publishedDateFromParts(item.issued?.["date-parts"]),
    url: item.URL || `https://doi.org/${doi}`,
    containerTitle: item["container-title"]?.[0] ?? null,
  };
}
