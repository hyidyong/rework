import type { ZodType } from "zod";

import type { CipherEnvelope } from "@/lib/security/envelope";
import type { NormalizedPaper } from "@/lib/research/normalize";

import type { AdvisorFeedback, AgentRole, DebateTurn } from "./contracts";

export type ModelRunRequest<T> = {
  role: AgentRole;
  systemPrompt: string;
  input: unknown;
  outputSchema: ZodType<T>;
};

export interface ModelGateway {
  run<T>(request: ModelRunRequest<T>): Promise<T>;
}

export interface ResearchGateway {
  search(queries: readonly string[]): Promise<NormalizedPaper[]>;
}

export type RunContext = {
  runId: string;
  proposalId: string;
  ownerId: string;
  title: string;
  proposalText: string;
  writingBrief?: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
};

export type AgentEventInput = {
  role: AgentRole;
  state:
    | "idle"
    | "thinking"
    | "researching"
    | "translating"
    | "writing"
    | "completed"
    | "error";
  message: string;
  metadata?: Record<string, unknown>;
};

export type RqRecordInput = {
  version: number;
  stage: "initial" | "debated" | "validated" | "final";
  questions: unknown;
  rationale: string;
  parentId?: string;
};

export type FinalPaperInput = {
  version: number;
  title: string;
  abstract: string;
  envelope: CipherEnvelope;
  status: "draft" | "reviewed" | "final";
};

export interface SwarmRepository {
  claimNextRun(workerId: string): Promise<RunContext | null>;
  loadRun(runId: string): Promise<RunContext>;
  setRunState(
    runId: string,
    update: {
      status?: RunContext["status"];
      currentStage?: AgentRole;
      progress?: number;
      errorMessage?: string | null;
    },
  ): Promise<void>;
  setAgentState(
    runId: string,
    role: AgentRole,
    state: AgentEventInput["state"],
    progress: number,
    currentTask: string,
  ): Promise<void>;
  appendEvent(runId: string, event: AgentEventInput): Promise<void>;
  saveRqRecord(runId: string, input: RqRecordInput): Promise<string>;
  saveDebateTurn(
    runId: string,
    turn: DebateTurn,
    turnNumber: number,
  ): Promise<void>;
  saveResearchPapers(
    runId: string,
    papers: readonly NormalizedPaper[],
  ): Promise<void>;
  saveAdvisorFeedback(runId: string, feedback: AdvisorFeedback): Promise<void>;
  saveFinalPaper(runId: string, paper: FinalPaperInput): Promise<void>;
  isCancelled(runId: string): Promise<boolean>;
}
