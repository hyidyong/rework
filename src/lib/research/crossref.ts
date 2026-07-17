import type { NormalizedPaper } from "./normalize";

type CrossrefItem = {
  title?: string[];
  author?: Array<{ given?: string; family?: string }>;
  published?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  DOI?: string;
  URL?: string;
  abstract?: string;
  score?: number;
};

type CrossrefResponse = { message?: { items?: CrossrefItem[] } };

export async function searchCrossref(
  query: string,
  fetcher: typeof fetch = fetch,
  limit = 8,
): Promise<NormalizedPaper[]> {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query.bibliographic", query);
  url.searchParams.set("rows", String(Math.min(Math.max(limit, 1), 20)));
  url.searchParams.set("select", "title,author,published,container-title,DOI,URL,abstract,score");
  const response = await fetcher(url, {
    headers: { "user-agent": "ResearchSwarm/0.1 (mailto:local-development@example.invalid)" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Crossref request failed with status ${response.status}`);
  const payload = (await response.json()) as CrossrefResponse;
  return (payload.message?.items ?? []).flatMap((item) => {
    const title = item.title?.[0]?.trim();
    if (!title || (!item.DOI && !item.URL)) return [];
    return [
      {
        title,
        authors: (item.author ?? []).map(({ given, family }) => [given, family].filter(Boolean).join(" ")),
        publicationYear: item.published?.["date-parts"]?.[0]?.[0],
        journal: item["container-title"]?.[0],
        doi: item.DOI,
        url: item.URL,
        sourceDatabase: "Crossref",
        region: "international" as const,
        languageCode: "en",
        abstractSummary: item.abstract?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        relevanceScore: item.score ? Math.min(item.score / 100, 1) : undefined,
      },
    ];
  });
}
