import type { AgentRole } from "./contracts";

export const STAGE_PROGRESS: Record<AgentRole, number> = {
  analyzer: 8,
  director: 16,
  rq_planner: 25,
  debater_a: 34,
  debater_b: 42,
  literature_researcher: 55,
  global_translator: 66,
  rq_validator: 76,
  academic_advisor: 88,
  main_writer: 96,
};

export const STAGE_TASKS: Record<AgentRole, string> = {
  analyzer: "계획서의 핵심 구조와 연구 방향을 추출하는 중",
  director: "학술 가치, 타당성과 논리적 위험을 점검하는 중",
  rq_planner: "측정 가능한 연구질문을 설계하는 중",
  debater_a: "연구질문의 기여와 실행 가능성을 옹호하는 중",
  debater_b: "편향, 타당도와 방법론 취약성을 비판하는 중",
  literature_researcher: "국내외 문헌 검색식과 근거를 수집하는 중",
  global_translator: "해외 문헌을 번역하고 비교 분석하는 중",
  rq_validator: "토론과 문헌 근거로 연구질문을 고도화하는 중",
  academic_advisor: "지도교수 관점의 종합 심사를 수행하는 중",
  main_writer: "최종 학술 원고를 집필하고 인용을 정리하는 중",
};
