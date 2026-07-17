import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sql } from "postgres";

import type { NormalizedPaper } from "@/lib/research/normalize";
import { decryptText, type CipherEnvelope } from "@/lib/security/envelope";

import type { AdvisorFeedback, AgentRole, DebateTurn } from "./contracts";
import type {
  AgentEventInput,
  FinalPaperInput,
  RqRecordInput,
  RunContext,
  SwarmRepository,
} from "./ports";

const SENSITIVE_KEY = /content|prompt|secret|key|token|body|cipher|abstract/i;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 50).map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEY.test(key))
        .map(([key, nested]) => [key, sanitizeValue(nested)]),
    );
  }
  if (typeof value === "string") return value.slice(0, 500);
  return value;
}

export function sanitizeAgentEvent(event: AgentEventInput): AgentEventInput {
  return {
    ...event,
    message: event.message
      .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
      .slice(0, 1000),
    metadata: sanitizeValue(event.metadata ?? {}) as Record<string, unknown>,
  };
}

type JoinedRun = {
  id: string;
  proposal_id: string;
  owner_id: string;
  status: RunContext["status"];
  proposals: {
    title: string;
    extracted_content_ciphertext: string;
    extracted_content_iv: string;
    extracted_content_tag: string;
  };
};

export class SupabaseSwarmRepository implements SwarmRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly sql: Sql,
    private readonly encryptionKey: string,
  ) {}

  async claimNextRun(workerId: string): Promise<RunContext | null> {
    const rows = await this.sql`select id from private.claim_next_pipeline_run(${workerId})`;
    const first = rows[0] as { id?: string } | undefined;
    return first?.id ? this.loadRun(first.id) : null;
  }

  async loadRun(runId: string): Promise<RunContext> {
    const { data, error } = await this.supabase
      .from("pipeline_runs")
      .select(
        "id, proposal_id, owner_id, status, proposals!inner(title, extracted_content_ciphertext, extracted_content_iv, extracted_content_tag)",
      )
      .eq("id", runId)
      .single();
    if (error || !data) throw new Error(`Unable to load pipeline run: ${error?.message ?? "not found"}`);
    const row = data as unknown as JoinedRun;
    const proposal = row.proposals;
    if (!proposal.extracted_content_ciphertext || !proposal.extracted_content_iv || !proposal.extracted_content_tag) {
      throw new Error("Proposal extraction is not available");
    }
    const envelope: CipherEnvelope = {
      version: 1,
      algorithm: "aes-256-gcm",
      ciphertext: proposal.extracted_content_ciphertext,
      iv: proposal.extracted_content_iv,
      tag: proposal.extracted_content_tag,
    };
    return {
      runId: row.id,
      proposalId: row.proposal_id,
      ownerId: row.owner_id,
      title: proposal.title,
      proposalText: decryptText(envelope, this.encryptionKey, `${row.owner_id}:${row.proposal_id}`),
      status: row.status,
    };
  }

  async setRunState(
    runId: string,
    update: { status?: RunContext["status"]; currentStage?: AgentRole; progress?: number; errorMessage?: string | null },
  ): Promise<void> {
    const patch = {
      ...(update.status ? { status: update.status } : {}),
      ...(update.currentStage ? { current_stage: update.currentStage } : {}),
      ...(update.progress !== undefined ? { progress: update.progress } : {}),
      ...(update.errorMessage !== undefined ? { error_message: update.errorMessage } : {}),
      ...(update.status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    };
    const { error } = await this.supabase.from("pipeline_runs").update(patch).eq("id", runId);
    if (error) throw new Error(`Unable to update pipeline run: ${error.message}`);
  }

  async setAgentState(
    runId: string,
    role: AgentRole,
    state: AgentEventInput["state"],
    progress: number,
    currentTask: string,
  ): Promise<void> {
    const run = await this.loadRun(runId);
    const { error } = await this.supabase.from("agent_status").upsert(
      {
        proposal_id: run.proposalId,
        pipeline_run_id: runId,
        owner_id: run.ownerId,
        role,
        state,
        progress,
        current_task: currentTask.slice(0, 500),
        heartbeat_at: new Date().toISOString(),
      },
      { onConflict: "pipeline_run_id,role" },
    );
    if (error) throw new Error(`Unable to persist agent state: ${error.message}`);
  }

  async appendEvent(runId: string, input: AgentEventInput): Promise<void> {
    const run = await this.loadRun(runId);
    const event = sanitizeAgentEvent(input);
    const { error } = await this.supabase.from("agent_events").insert({
      proposal_id: run.proposalId,
      pipeline_run_id: runId,
      owner_id: run.ownerId,
      role: event.role,
      state: event.state,
      message: event.message,
      metadata: event.metadata,
    });
    if (error) throw new Error(`Unable to append agent event: ${error.message}`);
  }

  async saveRqRecord(runId: string, input: RqRecordInput): Promise<string> {
    const run = await this.loadRun(runId);
    const { data, error } = await this.supabase
      .from("rq_records")
      .insert({
        proposal_id: run.proposalId,
        pipeline_run_id: runId,
        owner_id: run.ownerId,
        version: input.version,
        stage: input.stage,
        questions: input.questions,
        rationale: input.rationale,
        parent_id: input.parentId,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`Unable to save research questions: ${error?.message ?? "no row"}`);
    return (data as { id: string }).id;
  }

  async saveDebateTurn(runId: string, turn: DebateTurn, turnNumber: number): Promise<void> {
    const run = await this.loadRun(runId);
    const { error } = await this.supabase.from("debate_logs").insert({
      proposal_id: run.proposalId,
      pipeline_run_id: runId,
      owner_id: run.ownerId,
      round: turn.round,
      turn: turnNumber,
      speaker: turn.speaker,
      stance: turn.stance,
      content: turn.response,
    });
    if (error) throw new Error(`Unable to save debate turn: ${error.message}`);
  }

  async saveResearchPapers(runId: string, papers: readonly NormalizedPaper[]): Promise<void> {
    if (papers.length === 0) return;
    const run = await this.loadRun(runId);
    const { error } = await this.supabase.from("research_papers").insert(
      papers.map((paper) => ({
        proposal_id: run.proposalId,
        pipeline_run_id: runId,
        owner_id: run.ownerId,
        title: paper.title,
        authors: paper.authors,
        publication_year: paper.publicationYear,
        journal: paper.journal,
        doi: paper.doi,
        url: paper.url,
        source_database: paper.sourceDatabase,
        region: paper.region,
        language_code: paper.languageCode ?? "en",
        abstract_summary: paper.abstractSummary,
        translated_summary: paper.translatedSummary,
        relevance_score: paper.relevanceScore,
        metadata: paper.metadata ?? {},
      })),
    );
    if (error) throw new Error(`Unable to save research papers: ${error.message}`);
  }

  async saveAdvisorFeedback(runId: string, feedback: AdvisorFeedback): Promise<void> {
    const run = await this.loadRun(runId);
    const { error } = await this.supabase.from("advisor_feedbacks").insert({
      proposal_id: run.proposalId,
      pipeline_run_id: runId,
      owner_id: run.ownerId,
      rubric: feedback.rubric,
      summary: feedback.summary,
      required_revisions: feedback.requiredRevisions,
      recommendation: feedback.recommendation,
    });
    if (error) throw new Error(`Unable to save advisor feedback: ${error.message}`);
  }

  async saveFinalPaper(runId: string, paper: FinalPaperInput): Promise<void> {
    const run = await this.loadRun(runId);
    const { error } = await this.supabase.from("final_papers").insert({
      proposal_id: run.proposalId,
      pipeline_run_id: runId,
      owner_id: run.ownerId,
      version: paper.version,
      title: paper.title,
      abstract: paper.abstract,
      body_ciphertext: paper.envelope.ciphertext,
      body_iv: paper.envelope.iv,
      body_tag: paper.envelope.tag,
      status: paper.status,
    });
    if (error) throw new Error(`Unable to save final paper: ${error.message}`);
  }

  async isCancelled(runId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("pipeline_runs").select("status").eq("id", runId).single();
    if (error || !data) throw new Error(`Unable to read run status: ${error?.message ?? "not found"}`);
    return (data as { status: string }).status === "cancelled";
  }
}
