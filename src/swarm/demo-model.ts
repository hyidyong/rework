import type { AgentRole } from "./contracts";
import type { ModelGateway, ModelRunRequest } from "./ports";

function demoOutput(role: AgentRole, input: unknown): unknown {
  const context = input as {
    round?: number;
    papers?: Array<{ paperKey?: string; title?: string }>;
  };
  switch (role) {
    case "analyzer":
      return {
        summary:
          "업로드된 계획서는 핵심 연구문제와 연구대상, 예상 방법을 연결해 학술적으로 검증 가능한 연구를 제안한다.",
        thesisDirection:
          "계획서의 중심 개념 사이 관계를 실제 자료와 명시적 분석 절차로 검증하는 방향이다.",
        keyConcepts: ["연구문제", "학술적 타당성", "실증 분석"],
        methodologyHints: ["문헌 근거와 실증 자료를 결합한 혼합연구"],
        constraints: ["실제 표본과 자료 접근 범위는 연구자가 확정해야 한다"],
      };
    case "director":
      return {
        academicValue:
          "연구문제와 검증 절차를 연결한다는 학술적 가치가 있으나 개념의 조작화가 더 구체적이어야 한다.",
        feasibility:
          "자료 접근 범위를 명확히 제한하면 계획된 기간 안에 수행할 수 있다.",
        logicalRisks: [
          "핵심 변수의 인과 방향과 대안 설명이 충분히 분리되지 않을 수 있다",
        ],
        recommendations: [
          "대안 가설과 객관적 측정 지표를 연구설계에 포함할 것",
        ],
        verdict: "proceed",
      };
    case "rq_planner":
      return {
        researchQuestions: [
          {
            id: "RQ1",
            question:
              "연구대상 집단에서 핵심 독립변수의 수준은 주요 결과변수와 검증가능성에 어떤 관계를 보이는가?",
            variables: ["핵심 독립변수", "주요 결과변수", "검증가능성"],
            population: "계획서에 명시된 연구대상 집단",
            scope: "계획서의 연구기간과 자료 접근 범위 안에서 관찰 가능한 사례",
          },
        ],
        rationale:
          "관계의 방향, 대상, 변수와 관찰 범위를 명시해 실제 자료로 답할 수 있는 질문으로 구성했다.",
      };
    case "debater_a":
      return {
        round: context.round ?? 1,
        speaker: "debater_a",
        stance: "support",
        claims: ["연구대상과 변수가 명시되어 누적 가능한 실증 근거를 제공한다"],
        response:
          "대안 설명을 통제하고 객관적 지표를 함께 사용하면 제안된 질문은 학술적 기여와 실행 가능성을 동시에 확보할 수 있다.",
      };
    case "debater_b":
      return {
        round: context.round ?? 1,
        speaker: "debater_b",
        stance: "critique",
        claims: [
          "표본 선택과 자기보고 측정이 관찰된 관계를 왜곡할 가능성이 있다",
        ],
        response:
          "연구대상 선정 과정과 변수 측정 시점이 불명확하면 상관관계를 인과적 효과로 과도하게 해석할 위험이 남는다.",
      };
    case "literature_researcher":
      return {
        searchQueries: [
          "research design construct validity empirical study",
          "systematic review measurable research questions",
        ],
        inclusionCriteria: [
          "동료평가를 거친 실증 연구",
          "연구변수와 표본이 명시된 문헌",
        ],
        exclusionCriteria: ["서지 정보나 원문 출처를 확인할 수 없는 문헌"],
        synthesisFocus:
          "핵심 개념의 측정, 표본 설계와 대안 설명 통제 방식을 비교한다.",
      };
    case "global_translator": {
      const papers = context.papers ?? [];
      return {
        translations: papers.slice(0, 30).map((paper, index) => ({
          paperKey: paper.paperKey ?? `paper-${index + 1}`,
          koreanTitle: paper.title ?? `해외 선행연구 ${index + 1}`,
          koreanSummary:
            "이 문헌은 연구설계와 변수 측정의 관계를 실증적으로 검토하며 해석 시 표본과 방법론의 한계를 함께 고려한다.",
          keyFindings: ["명시적 측정과 통제 절차가 결과의 신뢰도를 높인다"],
        })),
        crossStudyInsights: [
          "개념의 명확한 조작화와 대안 설명 통제가 연구결과의 재현가능성을 높인다",
        ],
      };
    }
    case "rq_validator":
      return {
        revisedQuestions: [
          {
            id: "RQ1",
            question:
              "표본 선택과 대안 설명을 통제할 때 핵심 독립변수는 연구대상 집단의 주요 결과변수와 검증가능성에 어떤 관계를 보이는가?",
            variables: [
              "핵심 독립변수",
              "표본 선택",
              "주요 결과변수",
              "검증가능성",
            ],
            population: "계획서에 명시된 연구대상 집단",
            scope:
              "계획된 연구기간 안에 객관적 지표와 자료 출처를 확인할 수 있는 사례",
          },
        ],
        changeLog: [
          "토론에서 제기된 표본 선택과 대안 설명 통제 조건을 질문에 반영했다",
        ],
        validityAssessment:
          "문헌의 측정 기준과 세 차례 토론의 비판을 반영해 질문의 범위와 검증 가능성이 개선되었다.",
      };
    case "academic_advisor":
      return {
        rubric: { novelty: 4, rigor: 4, feasibility: 4, coherence: 4 },
        summary:
          "연구질문은 검증 가능하게 정리됐지만 실제 집필 전 표집 절차, 측정 도구와 분석 모형을 더 구체적으로 명시해야 한다.",
        requiredRevisions: [
          "표집 기준과 제외 기준을 방법론에 명시할 것",
          "핵심 변수의 객관적 측정 지표를 제시할 것",
        ],
        recommendation: "minor_revision",
      };
    case "main_writer":
      return {
        title: "검증 가능한 연구설계와 핵심 변수의 관계에 관한 학술적 연구",
        abstract:
          "본 연구는 계획서에 제시된 핵심 변수 사이 관계를 검증 가능한 연구설계로 분석한다. 세 차례 대립 토론과 국내외 문헌 검토를 바탕으로 표본 선택, 대안 설명과 측정 타당도를 통제하는 연구방법을 제안한다.",
        keywords: ["연구설계", "측정 타당도", "검증가능성"],
        markdown:
          "# 검증 가능한 연구설계와 핵심 변수의 관계\n\n## 초록\n본 연구는 계획서의 연구문제를 검증 가능한 설계로 정교화한다.\n\n## 1. 서론\n학술 연구의 기여는 명확한 질문과 검증 절차의 연결에서 출발한다. 본 연구는 토론과 문헌 근거를 함께 사용해 연구질문을 고도화한다.\n\n## 2. 이론적 배경\n핵심 개념의 조작화와 측정 타당도에 관한 선행연구를 종합한다.\n\n## 3. 연구방법\n표집 기준, 객관적 측정 지표와 대안 설명 통제 절차를 명시한 혼합연구 설계를 적용한다.\n\n## 4. 기대 결과와 논의\n연구결과는 핵심 변수의 관계와 검증가능성의 조건을 함께 설명할 것으로 기대된다.\n\n## 5. 한계\n실제 자료 접근 범위와 표본 대표성에는 제약이 있다.\n\n## 참고문헌\n실제 검색으로 확인된 문헌 목록을 최종 검토 단계에서 확정한다.",
        citations: [
          "실제 검색으로 확인된 문헌 목록은 연구자가 최종 검수해야 한다.",
        ],
      };
  }
}

export class DemoModelGateway implements ModelGateway {
  async run<T>(request: ModelRunRequest<T>): Promise<T> {
    return request.outputSchema.parse(demoOutput(request.role, request.input));
  }
}
