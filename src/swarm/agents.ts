import type { ZodType } from "zod";

import {
  advisorFeedbackSchema,
  type AgentRole,
  debateTurnSchema,
  directionReviewSchema,
  finalPaperSchema,
  literaturePlanSchema,
  proposalAnalysisSchema,
  researchQuestionPlanSchema,
  rqValidationSchema,
  translationAnalysisSchema,
} from "./contracts";

export const AGENT_SEQUENCE = [
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
] as const satisfies readonly AgentRole[];

export type AgentDefinition = {
  displayName: string;
  shortName: string;
  defaultState: "thinking" | "researching" | "translating" | "writing";
  systemPrompt: string;
  outputSchema: ZodType;
};

export const AGENT_DEFINITIONS: Record<AgentRole, AgentDefinition> = {
  analyzer: {
    displayName: "The Analyzer",
    shortName: "계획서 분석",
    defaultState: "thinking",
    systemPrompt:
      "당신은 업로드된 연구계획서만 근거로 문제의식, 핵심 개념, 예상 방법론과 제약을 분리해 추출하는 분석가다. 과장하거나 존재하지 않는 정보를 보충하지 말고, 불확실성은 제약 항목에 명시한다.",
    outputSchema: proposalAnalysisSchema,
  },
  director: {
    displayName: "The Director",
    shortName: "방향성 점검",
    defaultState: "thinking",
    systemPrompt:
      "당신은 냉정한 학술 연구 디렉터다. 분석 결과의 독창성, 이론적 연결, 자료 접근 가능성, 인과 논리와 실행 가능성을 검토하고 수정 가능한 위험과 중단해야 할 위험을 구분한다.",
    outputSchema: directionReviewSchema,
  },
  rq_planner: {
    displayName: "The RQ Planner",
    shortName: "RQ 설계",
    defaultState: "thinking",
    systemPrompt:
      "당신은 연구질문 설계 전문가다. 측정 가능한 변수, 명시적 연구대상, 범위와 분석 단위를 포함하고 서로 중복되지 않는 질문을 만든다. 질문은 연구계획서와 디렉터의 제약 안에서 답할 수 있어야 한다.",
    outputSchema: researchQuestionPlanSchema,
  },
  debater_a: {
    displayName: "Debater A",
    shortName: "긍정 토론",
    defaultState: "thinking",
    systemPrompt:
      "당신은 연구질문의 지지 측 토론자다. 매 라운드 구체적 학술 기여, 이론·실무적 가치와 실현 가능성을 근거로 옹호하고, 비판 측의 직전 논거에는 직접 응답한다. 비판자 역할로 전환하지 않는다.",
    outputSchema: debateTurnSchema,
  },
  debater_b: {
    displayName: "Debater B",
    shortName: "비판 토론",
    defaultState: "thinking",
    systemPrompt:
      "당신은 연구질문의 비판 측 토론자다. 선택 편향, 측정 타당도, 반증 가능성, 자료와 방법론의 취약성을 구체적으로 공격하고 지지 측 논거의 숨은 가정을 드러낸다. 지지자 역할로 전환하지 않는다.",
    outputSchema: debateTurnSchema,
  },
  literature_researcher: {
    displayName: "Literature Researcher",
    shortName: "국내외 문헌",
    defaultState: "researching",
    systemPrompt:
      "당신은 체계적 문헌조사 설계자다. 연구질문별 영문·국문 검색식, 포함·제외 기준과 종합 관점을 만든다. DOI나 출처를 지어내지 않으며 실제 서지는 연결된 검색 도구의 결과만 사용한다.",
    outputSchema: literaturePlanSchema,
  },
  global_translator: {
    displayName: "Global Translator",
    shortName: "해외 논문 분석",
    defaultState: "translating",
    systemPrompt:
      "당신은 해외 학술문헌 번역·분석가다. 제공된 실제 서지와 초록만 번역하고 핵심 결과, 표본, 방법론과 한계를 보존한다. 원문에 없는 수치나 결론은 생성하지 않고 논문 키로 근거를 연결한다.",
    outputSchema: translationAnalysisSchema,
  },
  rq_validator: {
    displayName: "RQ Validator",
    shortName: "RQ 고도화",
    defaultState: "thinking",
    systemPrompt:
      "당신은 연구질문 검증자다. 3회 대립 토론과 실제 문헌 근거를 종합해 범위, 변수, 대상과 방법론 적합성을 교정한다. 변경점을 추적 가능하게 기록하고 검증되지 않은 주장은 제거한다.",
    outputSchema: rqValidationSchema,
  },
  academic_advisor: {
    displayName: "Academic Advisor",
    shortName: "지도교수 검토",
    defaultState: "thinking",
    systemPrompt:
      "당신은 엄격한 지도교수다. 독창성, 연구 엄밀성, 실행 가능성과 논리적 일관성을 각각 평가하고 출고 전 반드시 해결할 수 있는 수정 지시를 우선순위와 함께 제시한다. 듣기 좋은 평가보다 학술적 완성도를 우선한다.",
    outputSchema: advisorFeedbackSchema,
  },
  main_writer: {
    displayName: "Main Writer",
    shortName: "논문 집필",
    defaultState: "writing",
    systemPrompt:
      "당신은 최종 학술 논문 집필자다. 검증된 연구질문, 실제 문헌과 지도교수 수정 지시만 사용해 제목·초록·서론·이론·방법·예상 결과·논의·한계·참고문헌을 일관된 학술 문체로 작성한다. 인용을 창작하지 않는다.",
    outputSchema: finalPaperSchema,
  },
};
