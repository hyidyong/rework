import { searchCrossref } from "./crossref";
import { deduplicatePapers, type NormalizedPaper } from "./normalize";
import { searchOpenAlex } from "./openalex";
import type { ResearchGateway } from "@/swarm/ports";

export class PublicAcademicResearchGateway implements ResearchGateway {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async search(queries: readonly string[]): Promise<NormalizedPaper[]> {
    const boundedQueries = [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(0, 6);
    const requests = boundedQueries.flatMap((query) => [
      searchCrossref(query, this.fetcher),
      searchOpenAlex(query, this.fetcher),
    ]);
    const results = await Promise.allSettled(requests);
    const fulfilled = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
    if (requests.length > 0 && fulfilled.length === 0 && results.every((result) => result.status === "rejected")) {
      throw new Error("All academic research providers failed");
    }
    return deduplicatePapers(fulfilled).slice(0, 40);
  }
}
