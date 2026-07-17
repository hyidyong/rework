import { RefreshCw } from "lucide-react";

import type { RqVersion } from "@/lib/demo/scenario";

export function RqEvolution({ versions }: { versions: RqVersion[] }) {
  return (
    <section className="panel rq-panel" aria-labelledby="rq-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TRACEABLE REFINEMENT</p>
          <h2 id="rq-title">RQ Evolution</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="최신 연구질문으로 이동"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <ol className="rq-timeline">
        {versions.map((item) => (
          <li key={item.version} data-current={item.current || undefined}>
            <time>{item.time}</time>
            <span className="timeline-node" />
            <div>
              <span className="version-badge">
                v{item.version} {item.label}
              </span>
              {item.questions.map((question) => (
                <p key={question}>{question}</p>
              ))}
              <small>{item.note}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
