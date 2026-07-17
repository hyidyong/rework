export type NormalizedPaper = {
  title: string;
  authors: string[];
  publicationYear?: number;
  journal?: string;
  doi?: string;
  url?: string;
  sourceDatabase: string;
  region: "domestic" | "international";
  languageCode?: string;
  abstractSummary?: string;
  translatedSummary?: string;
  relevanceScore?: number;
  metadata?: Record<string, unknown>;
};

export function normalizeDoi(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/[.,;]+$/, "")
    .toLowerCase();
  return /^10\.\d{4,9}\/.+/.test(normalized) ? normalized : undefined;
}

function paperKey(paper: NormalizedPaper): string {
  const doi = normalizeDoi(paper.doi);
  if (doi) return `doi:${doi}`;
  if (paper.url) return `url:${paper.url.trim().toLowerCase()}`;
  return `title:${paper.title.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export function deduplicatePapers(papers: readonly NormalizedPaper[]): NormalizedPaper[] {
  const byKey = new Map<string, NormalizedPaper>();
  for (const input of papers) {
    const paper = { ...input, doi: normalizeDoi(input.doi) };
    const key = paperKey(paper);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, paper);
      continue;
    }
    const databases = new Set(
      `${existing.sourceDatabase},${paper.sourceDatabase}`
        .split(",")
        .map((source) => source.trim())
        .filter(Boolean),
    );
    byKey.set(key, {
      ...paper,
      ...existing,
      authors: existing.authors.length >= paper.authors.length ? existing.authors : paper.authors,
      sourceDatabase: [...databases].join(", "),
      abstractSummary: existing.abstractSummary ?? paper.abstractSummary,
      relevanceScore: Math.max(existing.relevanceScore ?? 0, paper.relevanceScore ?? 0) || undefined,
    });
  }
  return [...byKey.values()];
}
