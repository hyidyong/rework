import { z } from "zod";

const mcpServerSchema = z.object({
  label: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  serverUrl: z.string().url(),
  allowedTools: z.array(z.string().min(1).max(128)).max(50).optional(),
  trusted: z.boolean().default(false),
});

export type McpServerConfig = z.infer<typeof mcpServerSchema>;

export type OpenAiTool =
  | { type: "web_search" }
  | {
      type: "mcp";
      server_label: string;
      server_url: string;
      allowed_tools?: string[];
      require_approval: "always" | "never";
    };

export function parseMcpServers(raw: string, allowlist: ReadonlySet<string>): McpServerConfig[] {
  const servers = z.array(mcpServerSchema).max(10).parse(JSON.parse(raw));
  return servers.map((server) => {
    const url = new URL(server.serverUrl);
    if (url.protocol !== "https:") throw new Error("MCP servers require HTTPS");
    if (url.username || url.password) throw new Error("MCP URLs may not embed credentials");
    if (!allowlist.has(url.hostname)) throw new Error(`MCP host is not allowlisted: ${url.hostname}`);
    return server;
  });
}

export function toOpenAiTools(servers: readonly McpServerConfig[]): OpenAiTool[] {
  return [
    { type: "web_search" },
    ...servers.map((server) => ({
      type: "mcp" as const,
      server_label: server.label,
      server_url: server.serverUrl,
      ...(server.allowedTools ? { allowed_tools: server.allowedTools } : {}),
      require_approval: server.trusted ? ("never" as const) : ("always" as const),
    })),
  ];
}
