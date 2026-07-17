// Generated-schema companion types. Refresh with `npm run db:types` after migration changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AgentRole =
  | "analyzer"
  | "director"
  | "rq_planner"
  | "debater_a"
  | "debater_b"
  | "literature_researcher"
  | "global_translator"
  | "rq_validator"
  | "academic_advisor"
  | "main_writer";

export type AgentState =
  | "idle"
  | "thinking"
  | "researching"
  | "translating"
  | "writing"
  | "completed"
  | "error";

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      agent_role: AgentRole;
      agent_state: AgentState;
      proposal_status: "uploaded" | "queued" | "processing" | "completed" | "failed";
      pipeline_run_status: "queued" | "running" | "completed" | "failed" | "cancelled";
      rq_stage: "initial" | "debated" | "validated" | "final";
      debate_stance: "support" | "critique";
      paper_region: "domestic" | "international";
      final_paper_status: "draft" | "reviewed" | "final";
    };
    CompositeTypes: Record<string, never>;
  };
};
