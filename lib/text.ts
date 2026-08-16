export function normalizeIssn(input: string): string | null {
  const digits = input.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (digits.length !== 8) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function stripJats(xml: string | undefined | null): string | null {
  if (!xml) return null;
  const text = xml
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

export function formatAuthors(
  authors?: Array<{ given?: string; family?: string; name?: string }>,
): string {
  if (!authors?.length) return "Unknown authors";
  const names = authors
    .map((author) => {
      if (author.name) return author.name;
      return [author.given, author.family].filter(Boolean).join(" ");
    })
    .filter(Boolean);
  return names.length ? names.join(", ") : "Unknown authors";
}

export function publishedDateFromParts(
  parts?: number[][] | undefined,
): string | null {
  const dateParts = parts?.[0];
  if (!dateParts?.length) return null;
  const [year, month = 1, day = 1] = dateParts;
  if (!year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function doiUrl(doi: string): string {
  if (doi.startsWith("http")) return doi;
  return `https://doi.org/${doi.replace(/^https?:\/\/doi.org\//i, "")}`;
}
