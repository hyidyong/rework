import { Activity, FileText, ShieldCheck } from "lucide-react";

import type { AgentView } from "@/lib/demo/scenario";

export function SelectedAgent({ agent }: { agent: AgentView }) {
  return (
    <section className="panel selected-agent" aria-labelledby="selected-agent-title">
      <div className="panel-heading"><div><p className="eyebrow">INSPECTOR</p><h2 id="selected-agent-title">선택된 에이전트</h2></div></div>
      <div className="agent-profile">
        <span className="profile-orbit" data-state={agent.state}><Activity size={26} /></span>
        <div><strong>{agent.name}</strong><p><i className="state-dot" data-state={agent.state} />{agent.state}</p></div>
      </div>
      <dl className="agent-details">
        <div><dt>현재 작업</dt><dd>{agent.task}</dd></div>
        <div><dt>역할</dt><dd>{agent.description}</dd></div>
        <div><dt><ShieldCheck size={14} /> 보안</dt><dd>원문 미노출 · 요약 이벤트만 전송</dd></div>
        <div><dt><FileText size={14} /> 진행률</dt><dd><span className="mini-progress"><i style={{ width: `${agent.progress}%` }} /></span>{agent.progress}%</dd></div>
      </dl>
    </section>
  );
}
