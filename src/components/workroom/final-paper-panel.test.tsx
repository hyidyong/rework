// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FinalPaperPanel } from "./final-paper-panel";

afterEach(cleanup);

describe("FinalPaperPanel", () => {
  const paper = {
    id: "paper-1",
    title: "AI 스포츠 승부예측 플랫폼 규제 연구",
    abstract: "비교법적 관점에서 규제 개선 방향을 검토한다.",
    version: 1,
  };

  it("shows the completed paper and opens its preview on demand", async () => {
    const onView = vi.fn().mockResolvedValue("# 최종 논문\n\n본문입니다.");
    render(<FinalPaperPanel paper={paper} onView={onView} />);

    expect(
      screen.getByRole("heading", { name: "최종 논문 결과물" }),
    ).toBeInTheDocument();
    expect(screen.getByText(paper.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Word 다운로드" })).toHaveAttribute(
      "href",
      "/api/final-papers/paper-1?format=docx",
    );

    fireEvent.click(screen.getByRole("button", { name: "결과물 보기" }));

    expect(await screen.findByText("최종 논문")).toBeInTheDocument();
    expect(screen.getByText("본문입니다.")).toBeInTheDocument();
  });

  it("does not render when no final paper exists", () => {
    const { container } = render(
      <FinalPaperPanel paper={undefined} onView={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
