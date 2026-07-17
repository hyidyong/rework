import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { loadRemoteSkill } from "./loader";

function response(body: string, contentType = "application/json") {
  return new Response(body, {
    headers: { "content-type": contentType },
    status: 200,
  });
}

describe("loadRemoteSkill", () => {
  it("loads only a verified prompt from an allowlisted HTTPS host", async () => {
    const prompt = "당신은 체계적 문헌고찰 검색식을 설계한다.";
    const sha256 = createHash("sha256").update(prompt).digest("hex");
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      return url.endsWith("manifest.json")
        ? response(
            JSON.stringify({
              name: "systematic-review",
              version: "1.0.0",
              role: "literature_researcher",
              promptUrl: "https://skills.example.edu/systematic-review.md",
              sha256,
            }),
          )
        : response(prompt, "text/markdown");
    });

    const skill = await loadRemoteSkill(
      "https://skills.example.edu/manifest.json",
      fetcher,
      new Set(["skills.example.edu"]),
    );

    expect(skill.prompt).toBe(prompt);
    expect(skill.manifest.sha256).toBe(sha256);
  });

  it.each([
    "http://skills.example.edu/manifest.json",
    "https://untrusted.example/manifest.json",
  ])("rejects an unsafe manifest URL: %s", async (url) => {
    await expect(
      loadRemoteSkill(url, vi.fn(), new Set(["skills.example.edu"])),
    ).rejects.toThrow();
  });

  it("rejects a SHA-256 mismatch", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          JSON.stringify({
            name: "bad-skill",
            version: "1.0.0",
            role: "analyzer",
            promptUrl: "https://skills.example.edu/prompt.md",
            sha256: "a".repeat(64),
          }),
        ),
      )
      .mockResolvedValueOnce(response("tampered", "text/markdown"));

    await expect(
      loadRemoteSkill(
        "https://skills.example.edu/manifest.json",
        fetcher,
        new Set(["skills.example.edu"]),
      ),
    ).rejects.toThrow(/digest/i);
  });

  it("rejects oversized manifests before parsing", async () => {
    const fetcher = vi.fn().mockResolvedValue(response("x".repeat(70_000)));

    await expect(
      loadRemoteSkill(
        "https://skills.example.edu/manifest.json",
        fetcher,
        new Set(["skills.example.edu"]),
      ),
    ).rejects.toThrow(/size/i);
  });
});
