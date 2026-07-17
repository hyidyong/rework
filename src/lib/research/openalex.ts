import type { NormalizedPaper } from "./normalize";

type OpenAlexWork = {
  id?: string;
  doi?: string;
  title?: string;
  publication_year?: number;
  primary_location?: { source?: { display_name?: string }; landing_page_url?: string };
  authorships?: Array<{ author?: { display_name?: string } }>;
  language?: string;
  cited_by_count?: number;
};

type OpenAlexResponse = { results?: OpenAlexWork[] };

export async function searchOpenAlex(
  query: string,
  fetcher: typeof fetch = fetch,
  limit = 8,
): Promise<NormalizedPaper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", String(Math.min(Math.max(limit, 1), 20)));
  url.searchParams.set("mailto", "local-development@example.invalid");
  const response = await fetcher(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`OpenAlex request failed with status ${response.status}`);
  const payload = (await response.json()) as OpenAlexResponse;
  return (payload.results ?? []).flatMap((work) => {
    if (!work.title || (!work.doi && !work.id)) return [];
    return [
      {
        title: work.title,
        authors: (work.authorships ?? []).flatMap((authorship) =>
          authorship.author?.display_name ? [authorship.author.display_name] : [],
        ),
        publicationYear: work.publication_year,
        journal: work.primary_location?.source?.display_name,
        doi: work.doi,
        url: work.primary_location?.landing_page_url ?? work.id,
        sourceDatabase: "OpenAlex",
        region: "international" as const,
        languageCode: work.language ?? "en",
        metadata: { citedByCount: work.cited_by_count ?? 0, openAlexId: work.id },
      },
    ];
  });
}
