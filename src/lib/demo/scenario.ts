import type { AgentRole } from "@/swarm/contracts";

export type AgentVisualState =
  | "idle"
  | "thinking"
  | "researching"
  | "translating"
  | "writing"
  | "completed"
  | "error";

export type AgentView = {
  index: number;
  role: AgentRole;
  name: string;
  koreanName: string;
  state: AgentVisualState;
  progress: number;
  task: string;
  description: string;
};

export type WorkroomLog = {
  id: string;
  time: string;
  role: AgentRole;
  agent: string;
  state: AgentVisualState;
  category: "analysis" | "debate" | "research" | "writing";
  message: string;
  link?: string;
};

export type RqVersion = {
  version: number;
  time: string;
  label: string;
  questions: string[];
  note: string;
  current?: boolean;
};

export type LiteratureNode = {
  id: string;
  label: string;
  kind: "core" | "related" | "supporting";
  x: number;
  y: number;
  url?: string;
};

export type FinalPaperView = {
  id: string;
  title: string;
  abstract: string;
  version: number;
};

export type WorkroomScenario = {
  projectTitle: string;
  overallProgress: number;
  connection: "demo" | "live" | "offline";
  agents: AgentView[];
  logs: WorkroomLog[];
  rqVersions: RqVersion[];
  literature: LiteratureNode[];
  paperCount: number;
  finalPaper?: FinalPaperView;
};

export const DEMO_SCENARIO: WorkroomScenario = {
  projectTitle: "AI 기반 학습 분석 연구",
  overallProgress: 62,
  connection: "demo",
  agents: [
    {
      index: 1,
      role: "analyzer",
      name: "Analyzer",
      koreanName: "계획서 분석",
      state: "completed",
      progress: 100,
      task: "핵심 개념 12개 추출",
      description: "계획서 요약 및 연구 방향성 추출",
    },
    {
      index: 2,
      role: "director",
      name: "Director",
      koreanName: "방향성 점검",
      state: "completed",
      progress: 100,
      task: "논리 위험 3개 점검",
      description: "학술적 가치와 연구 타당성 검토",
    },
    {
      index: 3,
      role: "rq_planner",
      name: "RQ Planner",
      koreanName: "RQ 설계",
      state: "completed",
      progress: 100,
      task: "초기 RQ 3개 설계",
      description: "측정 가능한 연구질문 구성",
    },
    {
      index: 4,
      role: "debater_a",
      name: "Debater A",
      koreanName: "긍정 토론",
      state: "thinking",
      progress: 72,
      task: "3라운드 기여도 논증",
      description: "RQ의 장점과 학술적 기여 옹호",
    },
    {
      index: 5,
      role: "debater_b",
      name: "Debater B",
      koreanName: "비판 토론",
      state: "thinking",
      progress: 72,
      task: "3라운드 방법론 반론",
      description: "예상 한계와 취약성 비판",
    },
    {
      index: 6,
      role: "literature_researcher",
      name: "Literature Researcher",
      koreanName: "국내외 문헌",
      state: "researching",
      progress: 64,
      task: "관련 문헌 15건 검증",
      description: "Crossref·OpenAlex 문헌 수집",
    },
    {
      index: 7,
      role: "global_translator",
      name: "Global Translator",
      koreanName: "해외 논문 분석",
      state: "translating",
      progress: 48,
      task: "핵심 문헌 5건 번역",
      description: "해외 저널 번역 및 비교 분석",
    },
    {
      index: 8,
      role: "rq_validator",
      name: "RQ Validator",
      koreanName: "RQ 고도화",
      state: "thinking",
      progress: 34,
      task: "측정 도구 타당도 검토",
      description: "토론과 문헌으로 RQ 수정",
    },
    {
      index: 9,
      role: "academic_advisor",
      name: "Academic Advisor",
      koreanName: "지도교수 검토",
      state: "idle",
      progress: 0,
      task: "선행 단계 대기",
      description: "종합 학술 비판과 수정 지시",
    },
    {
      index: 10,
      role: "main_writer",
      name: "Main Writer",
      koreanName: "최종 집필",
      state: "idle",
      progress: 0,
      task: "지도교수 검토 대기",
      description: "학술 문체의 최종 논문 작성",
    },
  ],
  logs: [
    {
      id: "l1",
      time: "10:24:31",
      role: "analyzer",
      agent: "Analyzer",
      state: "completed",
      category: "analysis",
      message: "계획서를 분석하고 핵심 개념과 범위를 추출했습니다.",
    },
    {
      id: "l2",
      time: "10:24:45",
      role: "director",
      agent: "Director",
      state: "completed",
      category: "analysis",
      message: "연구 흐름을 점검하고 논리 위험을 분류했습니다.",
    },
    {
      id: "l3",
      time: "10:25:18",
      role: "debater_a",
      agent: "Debater A",
      state: "thinking",
      category: "debate",
      message: "독립변수 정의와 학술 기여의 연결을 옹호했습니다.",
    },
    {
      id: "l4",
      time: "10:25:27",
      role: "debater_b",
      agent: "Debater B",
      state: "thinking",
      category: "debate",
      message: "측정 타당도와 표본 선택 편향에 대한 반론을 제기했습니다.",
    },
    {
      id: "l5",
      time: "10:26:03",
      role: "literature_researcher",
      agent: "Literature Researcher",
      state: "researching",
      category: "research",
      message: "관련 문헌 15건을 검색했습니다.",
      link: "https://doi.org/10.1016/j.compedu.2023.104512",
    },
    {
      id: "l6",
      time: "10:26:45",
      role: "global_translator",
      agent: "Global Translator",
      state: "translating",
      category: "research",
      message: "핵심 문헌 5건의 한국어 요약을 생성했습니다.",
    },
    {
      id: "l7",
      time: "10:27:18",
      role: "academic_advisor",
      agent: "Academic Advisor",
      state: "idle",
      category: "analysis",
      message: "연구방법 검토를 위해 선행 단계 완료를 기다리는 중입니다.",
    },
    {
      id: "l8",
      time: "10:27:32",
      role: "main_writer",
      agent: "Main Writer",
      state: "idle",
      category: "writing",
      message: "최종 원고 집필 큐가 준비되었습니다.",
    },
  ],
  rqVersions: [
    {
      version: 3,
      time: "10:25",
      label: "현재",
      current: true,
      questions: [
        "AI 기반 학습 분석이 대학생의 학습 성과에 미치는 영향은 무엇인가?",
        "학습 참여도는 AI 기반 분석과 학습 성과의 관계를 매개하는가?",
        "자기조절학습 능력은 이 관계를 조절하는가?",
      ],
      note: "토론·문헌 근거 반영",
    },
    {
      version: 2,
      time: "10:22",
      label: "검토",
      questions: ["RQ1~RQ3의 변수 정의와 범위를 수정"],
      note: "측정 타당도 조건 추가",
    },
    {
      version: 1,
      time: "10:18",
      label: "초안",
      questions: ["초기 연구질문 초안 3개 생성"],
      note: "계획서 분석 기반",
    },
    {
      version: 0,
      time: "10:10",
      label: "업로드",
      questions: ["계획서 업로드 완료"],
      note: "원문 암호화 저장",
    },
  ],
  literature: [
    { id: "core", label: "학습 분석\n(Metrics)", kind: "core", x: 180, y: 130 },
    {
      id: "p1",
      label: "AI in Education\n(2022)",
      kind: "supporting",
      x: 70,
      y: 55,
    },
    { id: "p2", label: "학습 참여도\n(2021)", kind: "core", x: 180, y: 35 },
    {
      id: "p3",
      label: "자기조절학습\n(2020)",
      kind: "supporting",
      x: 295,
      y: 55,
    },
    {
      id: "p4",
      label: "Learning Analytics\n(2023)",
      kind: "core",
      x: 75,
      y: 145,
    },
    { id: "p5", label: "학습 성과\n(2021)", kind: "core", x: 290, y: 145 },
    {
      id: "p6",
      label: "데이터 마이닝\n(2019)",
      kind: "related",
      x: 72,
      y: 225,
    },
    { id: "p7", label: "예측 모델\n(2022)", kind: "related", x: 135, y: 250 },
    {
      id: "p8",
      label: "교육 빅데이터\n(2018)",
      kind: "supporting",
      x: 195,
      y: 245,
    },
    {
      id: "p9",
      label: "SEM 적용 연구\n(2021)",
      kind: "related",
      x: 290,
      y: 220,
    },
  ],
  paperCount: 15,
};
