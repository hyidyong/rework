import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { decryptText } from "@/lib/security/envelope";

import type { AgentRole } from "./contracts";
import { MemorySwarmRepository } from "./memory-repository";
import { runSwarm } from "./orchestrator";
import type { ModelGateway, ModelRunRequest, ResearchGateway } from "./ports";

class FixtureModel implements ModelGateway {
  readonly calls: AgentRole[] = [];

  async run<T>(request: ModelRunRequest<T>): Promise<T> {
    this.calls.push(request.role);
    const input = request.input as { round?: number };
    const fixtures: Record<AgentRole, unknown> = {
      analyzer: {
        summary: "본 연구는 공공기관의 생성형 AI 도입이 연구생산성과 검증가능성에 미치는 영향을 분석한다.",
        thesisDirection: "조직 수준의 AI 활용 역량과 검증 절차 사이의 관계를 실증적으로 규명한다.",
        keyConcepts: ["생성형 AI", "연구생산성", "검증가능성"],
        methodologyHints: ["혼합연구 설계"],
        constraints: ["기관별 데이터 접근성 차이"],
      },
      director: {
        academicValue: "기술 수용 연구를 연구 품질의 검증가능성까지 확장한다는 학술적 가치가 충분하다.",
        feasibility: "기관 설문과 사례 인터뷰를 결합하면 제한된 기간에도 수행 가능하다.",
        logicalRisks: ["자기보고식 생산성 지표의 공통방법 편향"],
        recommendations: ["객관적 산출물 지표를 함께 수집할 것"],
        verdict: "proceed",
      },
      rq_planner: {
        researchQuestions: [
          {
            id: "RQ1",
            question: "공공 연구기관의 생성형 AI 활용 강도는 연구 산출물의 생산성과 검증가능성에 어떤 영향을 미치는가?",
            variables: ["AI 활용 강도", "연구생산성", "검증가능성"],
            population: "대한민국 공공 연구기관 연구자",
            scope: "2025년부터 2026년까지 수행된 연구 프로젝트",
          },
        ],
        rationale: "도입 수준과 결과 품질의 관계를 동시에 검증해 단순 수용 연구의 한계를 보완한다.",
      },
      debater_a: {
        round: input.round,
        speaker: "debater_a",
        stance: "support",
        claims: ["생산성과 검증가능성을 동시에 측정하면 학술적 기여가 명확하다"],
        response: "객관적 산출물과 절차 로그를 결합하면 자기보고 편향을 줄이면서 실제 도입 효과를 검증할 수 있다.",
      },
      debater_b: {
        round: input.round,
        speaker: "debater_b",
        stance: "critique",
        claims: ["AI 활용 강도와 과제 난이도 사이에 내생성이 존재할 수 있다"],
        response: "난도가 높은 과제일수록 AI를 더 사용할 가능성이 있어 관찰된 생산성 차이를 인과효과로 해석하기 어렵다.",
      },
      literature_researcher: {
        searchQueries: ["generative AI research productivity", "AI adoption reproducibility public research"],
        inclusionCriteria: ["동료평가 학술논문", "실증 자료를 포함한 연구"],
        exclusionCriteria: ["서지 정보가 확인되지 않는 문헌"],
        synthesisFocus: "AI 활용 수준, 생산성 지표와 검증가능성 지표의 조작화를 비교한다.",
      },
      global_translator: {
        translations: [
          {
            paperKey: "10.1000/test",
            koreanTitle: "생성형 AI와 연구 생산성",
            koreanSummary: "이 연구는 생성형 AI 도구 사용이 연구 업무 속도와 검토 절차에 미치는 영향을 분석하였다.",
            keyFindings: ["도구 활용은 초안 작성 시간을 단축했다"],
          },
        ],
        crossStudyInsights: ["생산성 향상과 검증 절차 강화는 별도의 관리 역량을 요구한다"],
      },
      rq_validator: {
        revisedQuestions: [
          {
            id: "RQ1",
            question: "과제 난이도를 통제할 때 공공 연구기관의 생성형 AI 활용 강도는 연구생산성과 절차적 검증가능성에 어떤 영향을 미치는가?",
            variables: ["AI 활용 강도", "과제 난이도", "연구생산성", "절차적 검증가능성"],
            population: "대한민국 공공 연구기관 연구자",
            scope: "2025년부터 2026년까지 완료된 연구 프로젝트",
          },
        ],
        changeLog: ["내생성 비판을 반영해 과제 난이도 통제 변수를 추가했다"],
        validityAssessment: "토론에서 확인된 내생성 위험과 문헌의 측정 방식을 반영해 구성타당도와 분석 가능성이 개선되었다.",
      },
      academic_advisor: {
        rubric: { novelty: 4, rigor: 4, feasibility: 4, coherence: 5 },
        summary: "연구질문은 명확하지만 기관 선택 과정과 객관적 생산성 지표의 산출 기준을 방법론에 더 구체적으로 제시해야 한다.",
        requiredRevisions: ["기관 표집 절차와 과제 난이도 측정 기준을 명시할 것"],
        recommendation: "minor_revision",
      },
      main_writer: {
        title: "공공 연구기관의 생성형 AI 활용이 연구생산성과 검증가능성에 미치는 영향",
        abstract:
          "본 연구는 공공 연구기관을 대상으로 생성형 AI 활용 강도와 연구생산성 및 절차적 검증가능성의 관계를 분석한다. 과제 난이도를 통제하고 설문, 산출물 지표와 인터뷰를 결합한 혼합연구를 제안한다.",
        keywords: ["생성형 AI", "연구생산성", "검증가능성"],
        markdown:
          "# 공공 연구기관의 생성형 AI 활용\n\n## 초록\n본 연구는 생성형 AI 활용의 효과를 분석한다.\n\n## 1. 서론\n연구 환경에서 생성형 AI가 빠르게 확산되고 있으나 생산성과 검증가능성에 대한 실증 근거는 제한적이다.\n\n## 2. 이론적 배경\n기술 수용과 조직 역량 관점을 결합한다.\n\n## 3. 연구방법\n공공 연구기관을 대상으로 설문, 산출물 분석과 인터뷰를 수행하며 과제 난이도를 통제한다.\n\n## 4. 기대 결과\nAI 활용은 생산성을 높이지만 검증 절차는 조직 역량에 따라 달라질 것으로 예상한다.\n\n## 참고문헌\nFixture Study. (2026). Generative AI and research productivity.",
        citations: ["Fixture Study. (2026). Generative AI and research productivity."],
      },
    };
    return request.outputSchema.parse(fixtures[request.role]);
  }
}

const research: ResearchGateway = {
  async search() {
    return [
      {
        title: "Generative AI and research productivity",
        authors: ["Fixture Author"],
        publicationYear: 2026,
        doi: "10.1000/test",
        url: "https://doi.org/10.1000/test",
        sourceDatabase: "Crossref",
        region: "international",
        abstractSummary: "A verified fixture abstract about productivity.",
      },
    ];
  },
};

describe("runSwarm", () => {
  it("executes the complete deterministic academic workflow", async () => {
    const repository = new MemorySwarmRepository({
      runId: "run-1",
      proposalId: "proposal-1",
      ownerId: "owner-1",
      title: "AI 연구 계획",
      proposalText: "공공 연구기관의 생성형 AI 도입 효과를 분석한다.",
    });
    const model = new FixtureModel();
    const encryptionKey = Buffer.alloc(32, 9).toString("base64");

    await runSwarm("run-1", { repository, model, research, encryptionKey });

    expect(model.calls).toEqual([
      "analyzer",
      "director",
      "rq_planner",
      "debater_a",
      "debater_b",
      "debater_a",
      "debater_b",
      "debater_a",
      "debater_b",
      "literature_researcher",
      "global_translator",
      "rq_validator",
      "academic_advisor",
      "main_writer",
    ]);
    expect(repository.debateTurns.map(({ speaker }) => speaker)).toEqual([
      "debater_a",
      "debater_b",
      "debater_a",
      "debater_b",
      "debater_a",
      "debater_b",
    ]);
    expect(repository.rqRecords.map(({ version }) => version)).toEqual([1, 2]);
    expect(repository.researchPapers[0].translatedSummary).toContain("생성형 AI 도구");
    expect(repository.advisorFeedbacks).toHaveLength(1);
    expect(repository.finalPapers).toHaveLength(1);
    expect(
      decryptText(
        repository.finalPapers[0].envelope,
        encryptionKey,
        "owner-1:proposal-1:final:1",
      ),
    ).toContain("## 3. 연구방법");
    expect(repository.run.status).toBe("completed");
    expect([...repository.agentStatuses.values()].every(({ state }) => state === "completed")).toBe(true);
  });
});
