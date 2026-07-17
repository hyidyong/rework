"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEMO_SCENARIO,
  type AgentView,
  type LiteratureNode,
  type RqVersion,
  type WorkroomLog,
  type WorkroomScenario,
} from "@/lib/demo/scenario";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PublicEnv } from "@/lib/env/schema";
import type { AgentRole } from "@/swarm/contracts";

type ProposalRow = { id: string; title: string };
type RunRow = { id: string; progress: number; status: string };
type AgentRow = {
  role: AgentRole;
  state: AgentView["state"];
  progress: number;
  current_task: string | null;
};
type EventRow = {
  id: number;
  created_at: string;
  role: AgentRole;
  state: AgentView["state"];
  message: string;
  metadata: Record<string, unknown>;
};
type RqRow = {
  id: string;
  version: number;
  stage: string;
  questions: unknown;
  rationale: string;
  created_at: string;
};
type PaperRow = {
  id: string;
  title: string;
  doi: string | null;
  url: string | null;
  relevance_score: number | null;
};

function timeLabel(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function questionStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    if (
      entry &&
      typeof entry === "object" &&
      "question" in entry &&
      typeof entry.question === "string"
    )
      return [entry.question];
    return [];
  });
}

function literatureNodes(papers: PaperRow[]): LiteratureNode[] {
  const nodes: LiteratureNode[] = [
    { id: "core", label: "Research\nEvidence", kind: "core", x: 180, y: 135 },
  ];
  papers.slice(0, 9).forEach((paper, index) => {
    const angle =
      (Math.PI * 2 * index) / Math.min(papers.length, 9) - Math.PI / 2;
    nodes.push({
      id: paper.id,
      label: `${paper.title.slice(0, 22)}${paper.title.length > 22 ? "…" : ""}`,
      kind: index < 3 ? "core" : index < 6 ? "related" : "supporting",
      x: 180 + Math.cos(angle) * 118,
      y: 140 + Math.sin(angle) * 105,
      url:
        paper.url ?? (paper.doi ? `https://doi.org/${paper.doi}` : undefined),
    });
  });
  return nodes;
}

export function useWorkroom(supabaseConfig: PublicEnv) {
  const [scenario, setScenario] = useState<WorkroomScenario>(DEMO_SCENARIO);
  const userIdRef = useRef<string>(undefined);

  const refresh = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    const supabase = getSupabaseBrowserClient(supabaseConfig);
    const { data: proposals } = await supabase
      .from("proposals")
      .select("id,title")
      .order("created_at", { ascending: false })
      .limit(1);
    const proposal = proposals?.[0] as ProposalRow | undefined;
    if (!proposal) return;
    const { data: runs } = await supabase
      .from("pipeline_runs")
      .select("id,progress,status")
      .eq("proposal_id", proposal.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const run = runs?.[0] as RunRow | undefined;
    if (!run) return;
    const [agentResult, eventResult, rqResult, paperResult] = await Promise.all(
      [
        supabase
          .from("agent_status")
          .select("role,state,progress,current_task")
          .eq("pipeline_run_id", run.id),
        supabase
          .from("agent_events")
          .select("id,created_at,role,state,message,metadata")
          .eq("pipeline_run_id", run.id)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("rq_records")
          .select("id,version,stage,questions,rationale,created_at")
          .eq("pipeline_run_id", run.id)
          .order("version", { ascending: false }),
        supabase
          .from("research_papers")
          .select("id,title,doi,url,relevance_score")
          .eq("pipeline_run_id", run.id)
          .order("relevance_score", { ascending: false })
          .limit(20),
      ],
    );
    const agentRows = (agentResult.data ?? []) as AgentRow[];
    const agents = DEMO_SCENARIO.agents.map((agent) => {
      const live = agentRows.find((row) => row.role === agent.role);
      return live
        ? {
            ...agent,
            state: live.state,
            progress: live.progress,
            task: live.current_task ?? agent.task,
          }
        : { ...agent, state: "idle" as const, progress: 0 };
    });
    const logs: WorkroomLog[] = ((eventResult.data ?? []) as EventRow[]).map(
      (event) => ({
        id: String(event.id),
        time: timeLabel(event.created_at),
        role: event.role,
        agent:
          agents.find((agent) => agent.role === event.role)?.name ?? event.role,
        state: event.state,
        category: event.role.startsWith("debater")
          ? "debate"
          : event.role.includes("research") || event.role.includes("translator")
            ? "research"
            : event.role === "main_writer"
              ? "writing"
              : "analysis",
        message: event.message,
        link:
          typeof event.metadata.url === "string"
            ? event.metadata.url
            : undefined,
      }),
    );
    const rqVersions: RqVersion[] = ((rqResult.data ?? []) as RqRow[]).map(
      (rq, index) => ({
        version: rq.version,
        time: timeLabel(rq.created_at).slice(0, 5),
        label: rq.stage,
        questions: questionStrings(rq.questions),
        note: rq.rationale,
        current: index === 0,
      }),
    );
    const papers = (paperResult.data ?? []) as PaperRow[];
    setScenario({
      projectTitle: proposal.title,
      overallProgress: run.progress,
      connection: "live",
      agents,
      logs: logs.length ? logs : DEMO_SCENARIO.logs.slice(0, 1),
      rqVersions: rqVersions.length
        ? rqVersions
        : DEMO_SCENARIO.rqVersions.slice(-1),
      literature: literatureNodes(papers),
      paperCount: papers.length,
    });
  }, [supabaseConfig]);

  const ensureAuthenticated = useCallback(async () => {
    if (userIdRef.current) return userIdRef.current;
    const response = await fetch("/api/auth/anonymous", { method: "POST" });
    if (!response.ok)
      throw new Error("Local anonymous session could not be created");
    const payload = (await response.json()) as { userId: string };
    userIdRef.current = payload.userId;
    return payload.userId;
  }, []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel:
      | ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]>
      | undefined;
    void (async () => {
      const userId = await ensureAuthenticated();
      if (!active) return;
      await refresh();
      if (!active) return;
      const supabase = getSupabaseBrowserClient(supabaseConfig);
      const nextChannel = supabase.channel(
        `workroom-${userId}-${crypto.randomUUID()}`,
      );
      [
        "pipeline_runs",
        "agent_status",
        "agent_events",
        "rq_records",
        "debate_logs",
        "research_papers",
        "advisor_feedbacks",
        "final_papers",
      ].forEach((table) => {
        nextChannel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `owner_id=eq.${userId}`,
          },
          () => {
            clearTimeout(timer);
            timer = setTimeout(() => void refresh(), 120);
          },
        );
      });
      channel = nextChannel;
      nextChannel.subscribe();
    })().catch((error: unknown) => {
      console.error(
        "Workroom realtime bootstrap failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      setScenario((current) => ({ ...current, connection: "offline" }));
    });
    return () => {
      active = false;
      clearTimeout(timer);
      if (channel)
        void getSupabaseBrowserClient(supabaseConfig).removeChannel(channel);
    };
  }, [ensureAuthenticated, refresh, supabaseConfig]);

  const uploadProposal = useCallback(
    async (file: File) => {
      await ensureAuthenticated();
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/proposals", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Proposal upload failed");
      }
      await refresh();
    },
    [ensureAuthenticated, refresh],
  );

  return { scenario, uploadProposal };
}
