import type { NormalizedPaper } from "@/lib/research/normalize";

import type { AdvisorFeedback, AgentRole, DebateTurn } from "./contracts";
import type {
  AgentEventInput,
  FinalPaperInput,
  RqRecordInput,
  RunContext,
  SwarmRepository,
} from "./ports";

export type MemoryAgentStatus = {
  role: AgentRole;
  state: AgentEventInput["state"];
  progress: number;
  currentTask: string;
};

export class MemorySwarmRepository implements SwarmRepository {
  readonly events: AgentEventInput[] = [];
  readonly agentStatuses = new Map<AgentRole, MemoryAgentStatus>();
  readonly rqRecords: Array<RqRecordInput & { id: string }> = [];
  readonly debateTurns: Array<DebateTurn & { turnNumber: number }> = [];
  readonly researchPapers: NormalizedPaper[] = [];
  readonly advisorFeedbacks: AdvisorFeedback[] = [];
  readonly finalPapers: FinalPaperInput[] = [];
  readonly run: RunContext;

  constructor(input: Omit<RunContext, "status"> & { status?: RunContext["status"] }) {
    this.run = { ...input, status: input.status ?? "queued" };
  }

  async claimNextRun(): Promise<RunContext | null> {
    if (this.run.status !== "queued") return null;
    this.run.status = "running";
    return { ...this.run };
  }

  async loadRun(runId: string): Promise<RunContext> {
    if (runId !== this.run.runId) throw new Error("Run not found");
    return { ...this.run };
  }

  async setRunState(
    runId: string,
    update: { status?: RunContext["status"]; currentStage?: AgentRole; progress?: number; errorMessage?: string | null },
  ): Promise<void> {
    if (runId !== this.run.runId) throw new Error("Run not found");
    if (update.status) this.run.status = update.status;
  }

  async setAgentState(
    _runId: string,
    role: AgentRole,
    state: AgentEventInput["state"],
    progress: number,
    currentTask: string,
  ): Promise<void> {
    this.agentStatuses.set(role, { role, state, progress, currentTask });
  }

  async appendEvent(_runId: string, event: AgentEventInput): Promise<void> {
    this.events.push(event);
  }

  async saveRqRecord(_runId: string, input: RqRecordInput): Promise<string> {
    const id = `rq-${this.rqRecords.length + 1}`;
    this.rqRecords.push({ ...input, id });
    return id;
  }

  async saveDebateTurn(_runId: string, turn: DebateTurn, turnNumber: number): Promise<void> {
    this.debateTurns.push({ ...turn, turnNumber });
  }

  async saveResearchPapers(_runId: string, papers: readonly NormalizedPaper[]): Promise<void> {
    this.researchPapers.push(...papers);
  }

  async saveAdvisorFeedback(_runId: string, feedback: AdvisorFeedback): Promise<void> {
    this.advisorFeedbacks.push(feedback);
  }

  async saveFinalPaper(_runId: string, paper: FinalPaperInput): Promise<void> {
    this.finalPapers.push(paper);
  }

  async isCancelled(): Promise<boolean> {
    return this.run.status === "cancelled";
  }
}
