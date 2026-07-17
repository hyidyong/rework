import { describe, expect, it } from "vitest";

import { AGENT_DEFINITIONS, AGENT_SEQUENCE } from "./agents";
import { debateTurnSchema, researchQuestionPlanSchema } from "./contracts";

describe("academic agent contracts", () => {
  it("defines all ten displayed personas in deterministic stage order", () => {
    expect(AGENT_SEQUENCE).toEqual([
      "analyzer",
      "director",
      "rq_planner",
      "debater_a",
      "debater_b",
      "literature_researcher",
      "global_translator",
      "rq_validator",
      "academic_advisor",
      "main_writer",
    ]);
    expect(Object.keys(AGENT_DEFINITIONS)).toHaveLength(10);
    expect(Object.values(AGENT_DEFINITIONS).every((agent) => agent.systemPrompt.length > 80)).toBe(true);
  });

  it("rejects an imprecise research-question payload", () => {
    expect(() =>
      researchQuestionPlanSchema.parse({
        researchQuestions: [{ id: "RQ1", question: "좋은가?" }],
        rationale: "짧음",
      }),
    ).toThrow();
  });

  it("enforces each debater's fixed role and three-round bounds", () => {
    expect(() =>
      debateTurnSchema.parse({
        round: 4,
        speaker: "debater_a",
        stance: "critique",
        claims: ["반론"],
        response: "잘못된 역할",
      }),
    ).toThrow();
  });
});
