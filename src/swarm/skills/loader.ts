import { createHash } from "node:crypto";

import { remoteSkillManifestSchema, type VerifiedSkill } from "./manifest";

const MAX_MANIFEST_BYTES = 64 * 1024;
const MAX_PROMPT_BYTES = 128 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

export type SkillFetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function assertAllowedHttpsUrl(rawUrl: string, allowlist: ReadonlySet<string>): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("Remote skills require HTTPS");
  if (!allowlist.has(url.hostname)) throw new Error(`Skill host is not allowlisted: ${url.hostname}`);
  if (url.username || url.password) throw new Error("Credential-bearing skill URLs are forbidden");
  return url;
}

async function readBounded(response: Response, maxBytes: number, label: string): Promise<string> {
  if (!response.ok) throw new Error(`${label} request failed with status ${response.status}`);
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new Error(`${label} exceeds the size limit`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) throw new Error(`${label} exceeds the size limit`);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function loadRemoteSkill(
  manifestUrl: string,
  fetcher: SkillFetcher = fetch,
  allowlist: ReadonlySet<string>,
): Promise<VerifiedSkill> {
  const safeManifestUrl = assertAllowedHttpsUrl(manifestUrl, allowlist);
  const manifestResponse = await fetcher(safeManifestUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "error",
  });
  const manifestText = await readBounded(manifestResponse, MAX_MANIFEST_BYTES, "Skill manifest");
  const manifest = remoteSkillManifestSchema.parse(JSON.parse(manifestText));
  const safePromptUrl = assertAllowedHttpsUrl(manifest.promptUrl, allowlist);
  const promptResponse = await fetcher(safePromptUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "error",
  });
  const prompt = await readBounded(promptResponse, MAX_PROMPT_BYTES, "Skill prompt");
  const digest = createHash("sha256").update(prompt).digest("hex");
  if (digest !== manifest.sha256) throw new Error("Skill prompt digest does not match its manifest");
  if (prompt.trim().length < 20) throw new Error("Skill prompt is too short");
  return { manifest, prompt };
}
