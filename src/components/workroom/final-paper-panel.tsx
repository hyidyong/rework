"use client";

import { Download, FileText, LoaderCircle } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import type { FinalPaperView } from "@/lib/demo/scenario";

export function FinalPaperPanel({
  paper,
  onView,
}: {
  paper?: FinalPaperView;
  onView: (id: string) => Promise<string>;
}) {
  const [body, setBody] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (!paper) return null;
  const paperId = paper.id;

  async function openPreview() {
    setLoading(true);
    setError(undefined);
    try {
      setBody(await onView(paperId));
    } catch {
      setError("결과물을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="panel final-paper-panel"
      aria-labelledby="final-paper-title"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">COMPLETED OUTPUT</p>
          <h2 id="final-paper-title">최종 논문 결과물</h2>
        </div>
        <span className="panel-meta">v{paper.version}</span>
      </div>
      <div className="final-paper-summary">
        <FileText aria-hidden="true" size={26} />
        <div>
          <strong>{paper.title}</strong>
          <p>{paper.abstract}</p>
        </div>
      </div>
      <div className="final-paper-actions">
        <button type="button" onClick={openPreview} disabled={loading}>
          {loading ? (
            <LoaderCircle className="spin" size={15} />
          ) : (
            <FileText size={15} />
          )}
          {loading ? "불러오는 중" : "결과물 보기"}
        </button>
        <a href={`/api/final-papers/${paper.id}?format=docx`}>
          <Download size={15} />
          Word 다운로드
        </a>
      </div>
      {error ? <p className="final-paper-error">{error}</p> : null}
      {body ? (
        <article className="final-paper-preview" aria-label="논문 미리보기">
          <ReactMarkdown>{body}</ReactMarkdown>
        </article>
      ) : null}
    </section>
  );
}
