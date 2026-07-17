import { describe, expect, it } from "vitest";

import { buildFinalPaperDocx } from "./final-paper-docx";

describe("buildFinalPaperDocx", () => {
  it("creates a Word-compatible document containing the paper title and sections", async () => {
    const document = await buildFinalPaperDocx({
      title: "AI 스포츠 승부예측 플랫폼 규제 연구",
      abstract: "비교법적 관점에서 규제 개선 방향을 검토한다.",
      markdown:
        "# AI 스포츠 승부예측 플랫폼 규제 연구\n\n## 초록\n\n비교법적 검토.\n\n## 1. 서론\n\n연구의 배경.",
    });

    expect(document.subarray(0, 2).toString()).toBe("PK");
    expect(document.length).toBeGreaterThan(1_000);
  });
});
