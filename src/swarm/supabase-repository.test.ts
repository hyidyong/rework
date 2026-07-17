import { describe, expect, it } from "vitest";

import { sanitizeAgentEvent } from "./supabase-repository";

describe("Supabase event persistence boundary", () => {
  it("redacts tokens and excludes confidential metadata fields", () => {
    const event = sanitizeAgentEvent({
      role: "analyzer",
      state: "thinking",
      message:
        "Calling service with Bearer very-secret-token and person@example.com",
      metadata: {
        queryCount: 3,
        proposalContent: "private proposal",
        apiKey: "secret",
        nested: { accessToken: "secret", count: 2 },
      },
    });

    expect(event.message).not.toContain("very-secret-token");
    expect(event.message).not.toContain("person@example.com");
    expect(event.metadata).toEqual({ queryCount: 3, nested: { count: 2 } });
  });
});
