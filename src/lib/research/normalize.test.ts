import { describe, expect, it } from "vitest";

import { deduplicatePapers, normalizeDoi } from "./normalize";

describe("research result normalization", () => {
  it.each([
    ["https://doi.org/10.1000/XYZ.12", "10.1000/xyz.12"],
    ["doi: 10.1000/xyz.12", "10.1000/xyz.12"],
    ["10.1000/XYZ.12.", "10.1000/xyz.12"],
  ])("normalizes DOI %s", (input, expected) => {
    expect(normalizeDoi(input)).toBe(expected);
  });

  it("deduplicates the same paper across databases by DOI", () => {
    const result = deduplicatePapers([
      {
        title: "A Study",
        authors: ["Kim"],
        doi: "https://doi.org/10.1000/ABC",
        url: "https://example.edu/a",
        sourceDatabase: "Crossref",
        region: "international",
      },
      {
        title: "A Study (indexed)",
        authors: ["Kim"],
        doi: "10.1000/abc",
        url: "https://openalex.org/W1",
        sourceDatabase: "OpenAlex",
        region: "international",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].doi).toBe("10.1000/abc");
    expect(result[0].sourceDatabase).toContain("Crossref");
    expect(result[0].sourceDatabase).toContain("OpenAlex");
  });
});
