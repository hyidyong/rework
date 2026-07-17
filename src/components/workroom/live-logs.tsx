"use client";

import { ExternalLink, Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";

import type { WorkroomLog } from "@/lib/demo/scenario";

type Filter = "all" | "debate" | "research";

export function LiveLogs({ logs }: { logs: WorkroomLog[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [autoscroll, setAutoscroll] = useState(true);
  const visible = useMemo(
    () => logs.filter((log) => filter === "all" || log.category === filter),
    [filter, logs],
  );
  return (
    <section className="panel live-logs" aria-labelledby="live-log-title">
      <div className="panel-heading log-heading">
        <div>
          <p className="eyebrow">REALTIME STREAM</p>
          <h2 id="live-log-title">실시간 로그</h2>
        </div>
        <div className="log-controls">
          <div className="tab-list" role="tablist" aria-label="로그 필터">
            {(
              [
                ["all", "전체"],
                ["debate", "토론"],
                ["research", "리서치"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="autoscroll"
            type="button"
            aria-pressed={autoscroll}
            onClick={() => setAutoscroll((value) => !value)}
          >
            {autoscroll ? <Pause size={13} /> : <Play size={13} />} 자동 스크롤
          </button>
        </div>
      </div>
      <div className="log-table" role="log" aria-live="polite">
        {visible.map((log) => (
          <div className="log-row" key={log.id} data-state={log.state}>
            <time>{log.time}</time>
            <span className="log-dot" aria-hidden="true" />
            <strong>{log.agent}</strong>
            <p>
              {log.message}
              {log.link ? (
                <a href={log.link} target="_blank" rel="noreferrer">
                  논문 링크 <ExternalLink size={11} />
                </a>
              ) : null}
            </p>
          </div>
        ))}
      </div>
      <div className="log-compose">
        <span>에이전트 활동은 안전한 요약만 스트리밍됩니다.</span>
        <kbd>LIVE</kbd>
      </div>
    </section>
  );
}
