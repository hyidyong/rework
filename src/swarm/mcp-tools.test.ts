import { describe, expect, it } from "vitest";

import { parseMcpServers, toOpenAiTools } from "./mcp-tools";

describe("MCP tool configuration", () => {
  it("requires approval by default and includes hosted web search", () => {
    const servers = parseMcpServers(
      JSON.stringify([{ label: "library", serverUrl: "https://mcp.example.edu/sse" }]),
      new Set(["mcp.example.edu"]),
    );
    const tools = toOpenAiTools(servers);

    expect(tools[0]).toEqual({ type: "web_search" });
    expect(tools[1]).toMatchObject({
      type: "mcp",
      server_label: "library",
      require_approval: "always",
    });
  });

  it("rejects untrusted hosts and embedded URL credentials", () => {
    expect(() =>
      parseMcpServers(
        JSON.stringify([{ label: "bad", serverUrl: "https://user:pass@evil.example/sse" }]),
        new Set(["mcp.example.edu"]),
      ),
    ).toThrow();
  });
});
