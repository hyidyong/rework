// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DEMO_SCENARIO } from "@/lib/demo/scenario";

import { LiveLogs } from "./live-logs";

afterEach(cleanup);

describe("LiveLogs", () => {
  it("filters debate and research events with accessible tabs", () => {
    render(<LiveLogs logs={DEMO_SCENARIO.logs} />);
    fireEvent.click(screen.getByRole("tab", { name: "토론" }));
    expect(screen.getByText(/측정 타당도/)).toBeInTheDocument();
    expect(screen.queryByText(/문헌 15건/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "리서치" }));
    expect(screen.getByText(/문헌 15건/)).toBeInTheDocument();
  });
});
