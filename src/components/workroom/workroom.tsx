"use client";

import { ChevronDown, FolderOpen, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { useWorkroom } from "@/lib/realtime/use-workroom";
import type { PublicEnv } from "@/lib/env/schema";
import type { AgentRole } from "@/swarm/contracts";

import { AgentSwarm } from "./agent-swarm";
import { LiteratureMap } from "./literature-map";
import { LiveLogs } from "./live-logs";
import { RqEvolution } from "./rq-evolution";
import { SelectedAgent } from "./selected-agent";
import { Sidebar } from "./sidebar";
import { UploadButton } from "./upload-button";

const legend = ["idle", "thinking", "researching", "translating", "writing", "completed"] as const;

export function Workroom({ supabaseConfig }: { supabaseConfig: PublicEnv }) {
  const { scenario, uploadProposal } = useWorkroom(supabaseConfig);
  const defaultRole = scenario.agents.find((agent) => agent.state !== "idle" && agent.state !== "completed")?.role ?? "analyzer";
  const [selectedRole, setSelectedRole] = useState<AgentRole>(defaultRole);
  const selectedAgent = useMemo(
    () => scenario.agents.find((agent) => agent.role === selectedRole) ?? scenario.agents[0],
    [scenario.agents, selectedRole],
  );
  return (
    <div className="app-shell" id="top">
      <Sidebar />
      <main className="workroom" id="dashboard">
        <header className="topbar">
          <div><p className="top-kicker">ACADEMIC MULTI-AGENT SYSTEM</p><h1>논문 작성 워룸</h1></div>
          <button className="project-switcher" type="button"><FolderOpen size={17} /><span>프로젝트: {scenario.projectTitle}</span><ChevronDown size={15} /></button>
          <div className="header-actions">
            <span className="secure-chip"><ShieldCheck size={16} />로컬 보안 연결</span>
            <UploadButton onUpload={uploadProposal} />
          </div>
        </header>
        <section className="progress-strip" aria-label={`전체 진행률 ${scenario.overallProgress}%`}>
          <strong>전체 진행률</strong><b>{scenario.overallProgress}%</b><span className="overall-progress"><i style={{ width: `${scenario.overallProgress}%` }} /></span>
          <div className="state-legend">{legend.map((state) => <span key={state} data-state={state}><i />{state}</span>)}</div>
          <span className="mode-badge" data-mode={scenario.connection}>{scenario.connection === "live" ? "LIVE DATA" : scenario.connection === "offline" ? "OFFLINE" : "DEMO DATA"}</span>
        </section>
        <div className="workspace-grid">
          <AgentSwarm agents={scenario.agents} selectedRole={selectedRole} onSelect={setSelectedRole} />
          <RqEvolution versions={scenario.rqVersions} />
          <div className="lower-workspace" id="logs"><LiveLogs logs={scenario.logs} /><SelectedAgent agent={selectedAgent} /></div>
          <div id="literature"><LiteratureMap nodes={scenario.literature} paperCount={scenario.paperCount} /></div>
        </div>
        <footer className="app-footer"><span>RE:SEARCH · Local-first academic orchestration</span><span>Encrypted at rest · RLS · Realtime</span></footer>
      </main>
    </div>
  );
}
