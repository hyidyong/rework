import { config } from "dotenv";
import pino from "pino";
import postgres from "postgres";

import { readServerEnv } from "@/lib/env/schema";
import { PublicAcademicResearchGateway } from "@/lib/research/gateway";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DemoModelGateway } from "@/swarm/demo-model";
import { parseMcpServers } from "@/swarm/mcp-tools";
import { OpenAIModelGateway } from "@/swarm/openai-gateway";
import { runSwarm } from "@/swarm/orchestrator";
import { SupabaseSwarmRepository } from "@/swarm/supabase-repository";

config({ path: ".env", quiet: true });

const logger = pino({ name: "research-swarm-worker", level: process.env.LOG_LEVEL ?? "info" });
const pollDelay = () => new Promise<void>((resolve) => setTimeout(resolve, 1500));

async function main() {
  const env = readServerEnv();
  if (!env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL is required by the durable worker");
  const sql = postgres(env.SUPABASE_DB_URL, { max: 3, idle_timeout: 20, connect_timeout: 10 });
  const repository = new SupabaseSwarmRepository(getSupabaseAdmin(), sql, env.DATA_ENCRYPTION_KEY);
  const allowlist = new Set(
    env.SKILL_REGISTRY_ALLOWLIST.split(",")
      .map((host) => host.trim())
      .filter(Boolean),
  );
  const mcpServers = parseMcpServers(env.MCP_SERVERS_JSON, allowlist);
  const model = env.OPENAI_API_KEY
    ? new OpenAIModelGateway({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL, mcpServers })
    : new DemoModelGateway();
  const research = new PublicAcademicResearchGateway();
  const once = process.argv.includes("--once");
  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  logger.info({ mode: env.OPENAI_API_KEY ? "openai" : "demo" }, "worker started");
  try {
    do {
      const run = await repository.claimNextRun(`worker-${process.pid}`);
      if (!run) {
        if (once) break;
        await pollDelay();
        continue;
      }
      logger.info({ runId: run.runId, proposalId: run.proposalId }, "pipeline claimed");
      try {
        await runSwarm(run.runId, { repository, model, research, encryptionKey: env.DATA_ENCRYPTION_KEY });
        logger.info({ runId: run.runId }, "pipeline completed");
      } catch (error) {
        logger.error({ runId: run.runId, errorType: error instanceof Error ? error.name : "UnknownError" }, "pipeline failed");
      }
    } while (!stopping);
  } finally {
    await sql.end({ timeout: 5 });
    logger.info("worker stopped");
  }
}

main().catch((error) => {
  logger.fatal({ errorType: error instanceof Error ? error.name : "UnknownError" }, "worker crashed");
  process.exitCode = 1;
});
