import {
  BookOpen,
  BrainCircuit,
  CircleGauge,
  Languages,
  MessageSquareMore,
  PenLine,
  Route,
  ShieldCheck,
  University,
} from "lucide-react";

import type { AgentView } from "@/lib/demo/scenario";
import type { AgentRole } from "@/swarm/contracts";

const icons = {
  analyzer: BrainCircuit,
  director: Route,
  rq_planner: CircleGauge,
  debater_a: MessageSquareMore,
  debater_b: MessageSquareMore,
  literature_researcher: BookOpen,
  global_translator: Languages,
  rq_validator: ShieldCheck,
  academic_advisor: University,
  main_writer: PenLine,
} satisfies Record<AgentRole, typeof BrainCircuit>;

const stateLabels: Record<AgentView["state"], string> = {
  idle: "Idle",
  thinking: "Thinking",
  researching: "Researching",
  translating: "Translating",
  writing: "Writing",
  completed: "Completed",
  error: "Error",
};

export function AgentSwarm({ agents, selectedRole, onSelect }: { agents: AgentView[]; selectedRole: AgentRole; onSelect: (role: AgentRole) => void }) {
  return (
    <section className="panel agent-swarm-panel" aria-labelledby="agent-swarm-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ORCHESTRATION</p>
          <h2 id="agent-swarm-title">Agent Swarm</h2>
        </div>
        <span className="panel-meta">9단계 · 10 페르소나</span>
      </div>
      <div className="agent-flow" role="list" aria-label="학술 에이전트 실행 순서">
        {agents.map((agent) => {
          const Icon = icons[agent.role];
          const active = agent.state !== "idle" && agent.state !== "completed";
          return (
            <button
              type="button"
              role="button"
              aria-pressed={selectedRole === agent.role}
              aria-label={`${agent.name}, ${stateLabels[agent.state]}`}
              className="agent-card"
              data-state={agent.state}
              data-active={active || undefined}
              key={agent.role}
              onClick={() => onSelect(agent.role)}
            >
              <span className="agent-index">{agent.index}</span>
              <span className="agent-icon"><Icon aria-hidden="true" size={24} strokeWidth={1.65} /></span>
              <strong>{agent.name}</strong>
              <small>{agent.koreanName}</small>
              <span className="agent-state"><i aria-hidden="true" />{stateLabels[agent.state]}</span>
              {active ? <span className="activity-rings" aria-hidden="true"><i /><i /></span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
