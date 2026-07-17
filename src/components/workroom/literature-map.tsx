import type { LiteratureNode } from "@/lib/demo/scenario";

export function LiteratureMap({
  nodes,
  paperCount,
}: {
  nodes: LiteratureNode[];
  paperCount: number;
}) {
  const core = nodes[0];
  return (
    <section
      className="panel literature-panel"
      aria-labelledby="literature-title"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">EVIDENCE GRAPH</p>
          <h2 id="literature-title">Literature Map</h2>
        </div>
        <span className="panel-meta">{paperCount} papers</span>
      </div>
      <div className="map-legend">
        <span data-kind="core">핵심 문헌</span>
        <span data-kind="related">관련 문헌</span>
        <span data-kind="supporting">보조 문헌</span>
      </div>
      <svg
        className="literature-map"
        viewBox="0 0 360 280"
        role="img"
        aria-label={`${paperCount}개 문헌의 관계도`}
      >
        {nodes.slice(1).map((node) => (
          <line
            key={`line-${node.id}`}
            x1={core.x}
            y1={core.y}
            x2={node.x}
            y2={node.y}
          />
        ))}
        {nodes.map((node) => (
          <g
            key={node.id}
            className="paper-node"
            data-kind={node.kind}
            transform={`translate(${node.x} ${node.y})`}
          >
            <circle
              r={
                node.kind === "core" && node.id === "core"
                  ? 35
                  : node.kind === "core"
                    ? 7
                    : 6
              }
            />
            {node.label.split("\n").map((line, index) => (
              <text
                key={line}
                y={(index + 1) * 13 + (node.id === "core" ? -13 : 13)}
                textAnchor="middle"
              >
                {line}
              </text>
            ))}
          </g>
        ))}
      </svg>
      <footer>
        <span>DOI·원문 URL 기준 중복 제거</span>
        <button type="button">전체 보기</button>
      </footer>
    </section>
  );
}
