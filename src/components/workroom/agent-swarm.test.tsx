// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEMO_SCENARIO } from "@/lib/demo/scenario";

import { AgentSwarm } from "./agent-swarm";

afterEach(cleanup);

describe("AgentSwarm", () => {
  it("renders all ten personas and exposes active state accessibly", () => {
    render(
      <AgentSwarm agents={DEMO_SCENARIO.agents} selectedRole="literature_researcher" onSelect={vi.fn()} />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(10);
    expect(screen.getByRole("button", { name: /Literature Researcher/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Global Translator")).toBeInTheDocument();
    expect(screen.getByText("Main Writer")).toBeInTheDocument();
  });

  it("selects an agent card", () => {
    const onSelect = vi.fn();
    render(<AgentSwarm agents={DEMO_SCENARIO.agents} selectedRole="analyzer" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Debater B/i }));
    expect(onSelect).toHaveBeenCalledWith("debater_b");
  });
});
